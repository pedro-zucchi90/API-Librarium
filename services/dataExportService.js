const Usuario = require('../models/User');
const Habito = require('../models/Habit');
const Progresso = require('../models/Progress');
const Conquista = require('../models/Achievement');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const xml2js = require('xml2js');

class DataExportService {
  // Exportar dados completos do usuário em JSON ou XML
  static async exportarDadosCompletos(usuarioId, formato = 'json') {
    try {
      // Buscar dados do usuário
      const usuario = await Usuario.findById(usuarioId).lean();
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      const habitos = await Habito.find({ idUsuario: usuarioId }).lean();
      const progressos = await Progresso.find({ idUsuario: usuarioId }).lean();
      const conquistas = await Conquista.find({ idUsuario: usuarioId }).lean();

      // Preparar dados para exportação
      const dados = {
        usuario: {
          ...usuario,
          senha: undefined // Não exportar senha
        },
        habitos,
        progressos,
        conquistas,
        metadata: {
          exportadoEm: new Date().toISOString(),
          versao: '1.0.0',
          totalRegistros: habitos.length + progressos.length + conquistas.length
        }
      };

      let resultado;
      let tipoConteudo;
      let nomeArquivo;

      switch (formato.toLowerCase()) {
        case 'json':
          resultado = JSON.stringify(dados, null, 2);
          tipoConteudo = 'application/json';
          nomeArquivo = `librarium_${usuarioId}_${Date.now()}.json`;
          break;

        case 'xml':
          resultado = await this.converterParaXML(dados);
          tipoConteudo = 'application/xml';
          nomeArquivo = `librarium_${usuarioId}_${Date.now()}.xml`;
          break;

        default:
          throw new Error(`Formato não suportado: ${formato}`);
      }

      return {
        sucesso: true,
        dados: resultado,
        tipoConteudo,
        nomeArquivo,
        tamanho: resultado.length
      };

    } catch (erro) {
      console.error('Erro ao exportar dados:', erro);
      throw new Error('Falha na exportação de dados');
    }
  }

  // Exportar dados em formato compactado (ZIP)
  static async exportarDadosCompactados (usuarioId) {
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      const dados = await this.exportarDadosCompletos(usuarioId, 'json');

      // Criar arquivo temporário
      const tempDir = path.join(__dirname, '../temp');
      await fs.mkdir(tempDir, { recursive: true });

      const nomeArquivo = `librarium_${usuario.nomeUsuario}_${new Date().toISOString().split('T')[0]}.zip`;
      const caminhoArquivo = path.join(tempDir, nomeArquivo);

      // Criar arquivo ZIP
      const output = fs.createWriteStream(caminhoArquivo);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.append(dados.dados, { name: 'dados.json' });

      // Adicionar arquivo de metadados
      const metadados = {
        exportacao: {
          usuario: usuario.nomeUsuario,
          data: new Date().toISOString(),
          versao: '1.0.0',
          totalRegistros: dados.tamanho // ou dados.metadata.totalRegistros se necessário
        }
      };

      archive.append(JSON.stringify(metadados, null, 2), { name: 'metadados.json' });

      // Adicionar arquivo README
      const readme = this.gerarReadmeExportacao(usuario);
      archive.append(readme, { name: 'README.md' });

      await archive.finalize();

      // Ler arquivo criado
      const arquivoBuffer = await fs.readFile(caminhoArquivo);

      // Limpar arquivo temporário
      await fs.unlink(caminhoArquivo);

      return {
        dados: arquivoBuffer,
        nomeArquivo,
        tipoConteudo: 'application/zip'
      };
    } catch (erro) {
      console.error('Erro ao exportar dados compactados:', erro);
      throw erro;
    }
  }

  // Importar dados do usuário
  static async importarDados (usuarioId, dados, opcoes = {}) {
    try {
      const {
        sobrescrever = false,
        mesclar = true,
        validarDuplicidade = true,
        criarBackup = true
      } = opcoes;

      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Criar backup antes da importação
      if (criarBackup) {
        await this.criarBackupAutomatico(usuarioId);
      }

      const resultados = {
        usuario: { atualizado: false, erros: [] },
        habitos: { importados: 0, atualizados: 0, erros: [] },
        progressos: { importados: 0, atualizados: 0, erros: [] },
        conquistas: { importados: 0, atualizados: 0, erros: [] },
        notificacoes: { importados: 0, atualizados: 0, erros: [] }
      };

      // Importar dados do usuário
      if (dados.usuario && (sobrescrever || mesclar)) {
        try {
          const camposPermitidos = [
            'nomeUsuario', 'preferencias', 'personalizacaoAvatar'
          ];

          for (const campo of camposPermitidos) {
            if (dados.usuario[campo] !== undefined) {
              usuario[campo] = dados.usuario[campo];
            }
          }

          await usuario.save();
          resultados.usuario.atualizado = true;
        } catch (erro) {
          resultados.usuario.erros.push(`Erro ao atualizar usuário: ${erro.message}`);
        }
      }

      // Importar hábitos
      if (dados.habitos && Array.isArray(dados.habitos)) {
        for (const habitoData of dados.habitos) {
          try {
            if (sobrescrever) {
              // Deletar hábito existente se existir
              await Habito.findOneAndDelete({
                idUsuario: usuarioId,
                titulo: habitoData.titulo
              });
            }

            const novoHabito = new Habito({
              ...habitoData,
              idUsuario: usuarioId,
              _id: undefined // Permitir que o MongoDB gere novo ID
            });

            await novoHabito.save();
            resultados.habitos.importados++;
          } catch (erro) {
            resultados.habitos.erros.push(`Erro ao importar hábito ${habitoData.titulo}: ${erro.message}`);
          }
        }
      }

      // Importar progressos
      if (dados.progressos && Array.isArray(dados.progressos)) {
        for (const progressoData of dados.progressos) {
          try {
            if (sobrescrever) {
              // Deletar progresso existente se existir
              await Progresso.findOneAndDelete({
                idUsuario: usuarioId,
                data: progressoData.data,
                idHabito: progressoData.idHabito
              });
            }

            const novoProgresso = new Progresso({
              ...progressoData,
              idUsuario: usuarioId,
              _id: undefined
            });

            await novoProgresso.save();
            resultados.progressos.importados++;
          } catch (erro) {
            resultados.progressos.erros.push(`Erro ao importar progresso: ${erro.message}`);
          }
        }
      }

      // Importar conquistas
      if (dados.conquistas && Array.isArray(dados.conquistas)) {
        for (const conquistaData of dados.conquistas) {
          try {
            if (sobrescrever) {
              // Deletar conquista existente se existir
              await Conquista.findOneAndDelete({
                idUsuario: usuarioId,
                titulo: conquistaData.titulo
              });
            }

            const novaConquista = new Conquista({
              ...conquistaData,
              idUsuario: usuarioId,
              _id: undefined
            });

            await novaConquista.save();
            resultados.conquistas.importados++;
          } catch (erro) {
            resultados.conquistas.erros.push(`Erro ao importar conquista ${conquistaData.titulo}: ${erro.message}`);
          }
        }
      }

      // Importar notificações
      if (dados.notificacoes && Array.isArray(dados.notificacoes)) {
        for (const notificacaoData of dados.notificacoes) {
          try {
            if (sobrescrever) {
              // Deletar notificação existente se existir
              await Notificacao.findOneAndDelete({
                destinatario: usuarioId,
                titulo: notificacaoData.titulo,
                createdAt: notificacaoData.createdAt
              });
            }

            const novaNotificacao = new Notificacao({
              ...notificacaoData,
              destinatario: usuarioId,
              _id: undefined
            });

            await novaNotificacao.save();
            resultados.notificacoes.importados++;
          } catch (erro) {
            resultados.notificacoes.erros.push(`Erro ao importar notificação: ${erro.message}`);
          }
        }
      }

      // Recalcular estatísticas do usuário
      await this.recalcularEstatisticasUsuario(usuarioId);

      return {
        sucesso: true,
        mensagem: 'Dados importados com sucesso',
        resultados,
        resumo: {
          totalImportado:
            resultados.habitos.importados +
            resultados.progressos.importados +
            resultados.conquistas.importados +
            resultados.notificacoes.importados,
          totalErros:
            resultados.usuario.erros.length +
            resultados.habitos.erros.length +
            resultados.progressos.erros.length +
            resultados.conquistas.erros.length +
            resultados.notificacoes.erros.length
        }
      };
    } catch (erro) {
      console.error('Erro ao importar dados:', erro);
      throw erro;
    }
  }

  // Criar backup automático antes da importação
  static async criarBackupAutomatico (usuarioId) {
    try {
      const backup = await this.exportarDadosCompletos(usuarioId, 'json');

      const backupDir = path.join(__dirname, '../backups');
      await fs.mkdir(backupDir, { recursive: true });

      const nomeBackup = `backup_${usuarioId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const caminhoBackup = path.join(backupDir, nomeBackup);

      await fs.writeFile(caminhoBackup, typeof backup.dados === 'string' ? backup.dados : JSON.stringify(backup.dados, null, 2));

      console.log(`Backup automático criado: ${caminhoBackup}`);
      return caminhoBackup;
    } catch (erro) {
      console.error('Erro ao criar backup automático:', erro);
      // Não falhar a importação se o backup falhar
    }
  }

  // Recalcular estatísticas do usuário após importação
  static async recalcularEstatisticasUsuario (usuarioId) {
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) return;

      // Recalcular XP total
      const progressos = await Progresso.find({ idUsuario: usuarioId, status: 'concluido' });
      const xpTotal = progressos.reduce((total, p) => total + p.experienciaGanha, 0);

      usuario.experiencia = xpTotal;

      // Recalcular sequência
      const habitos = await Habito.find({ idUsuario: usuarioId, ativo: true });
      let maiorSequencia = 0;

      for (const habito of habitos) {
        if (habito.sequencia && habito.sequencia.maiorSequencia > maiorSequencia) {
          maiorSequencia = habito.sequencia.maiorSequencia;
        }
      }

      if (usuario.sequencia) {
        usuario.sequencia.maiorSequencia = maiorSequencia;
      }

      await usuario.save();

      console.log(`Estatísticas recalculadas para usuário ${usuarioId}`);
    } catch (erro) {
      console.error('Erro ao recalcular estatísticas:', erro);
    }
  }

  // Converter dados para XML
  static async converterParaXML (dados) {
    try {
      const builder = new xml2js.Builder({
        rootName: 'librarium',
        headless: true,
        renderOpts: { pretty: true, indent: '  ' }
      });

      // Preparar dados para XML (remover campos que não são válidos em XML)
      const dadosParaXML = {
        metadata: dados.metadata,
        usuario: dados.usuario,
        habitos: { habito: dados.habitos },
        progressos: { progresso: dados.progressos },
        conquistas: { conquista: dados.conquistas }
      };

      return builder.buildObject(dadosParaXML);
    } catch (erro) {
      console.error('Erro ao converter para XML:', erro);
      throw erro;
    }
  }

  // Gerar arquivo README para exportação
  static gerarReadmeExportacao (usuario) {
    return `# Librarium - Backup de Dados

## Usuário
- **Nome**: ${usuario.nomeUsuario}
- **Nível**: ${usuario.nivel}
- **Título**: ${usuario.titulo}
- **Data de Exportação**: ${new Date().toLocaleDateString('pt-BR')}

## Conteúdo do Backup
Este arquivo contém todos os dados do seu perfil no Librarium:

- **Hábitos**: Todos os hábitos criados e suas configurações
- **Progresso**: Histórico completo de conclusões e falhas
- **Conquistas**: Conquistas desbloqueadas e disponíveis
- **Perfil**: Configurações e personalizações do usuário

## Como Restaurar
1. Acesse o Librarium
2. Vá em Configurações > Importar Dados
3. Selecione este arquivo
4. Escolha as opções de importação
5. Confirme a operação

## Importante
- Este backup é específico para o usuário ${usuario.nomeUsuario}
- Não compartilhe este arquivo com outros usuários
- Mantenha backups regulares para preservar seus dados
- A importação pode sobrescrever dados existentes

## Suporte
Em caso de problemas, entre em contato com o suporte do Librarium.

---
*Backup gerado automaticamente pelo sistema Librarium*
`;
  }

  // Validar dados antes da importação
  static validarDadosImportacao (dados) {
    const erros = [];

    if (!dados.usuario) {
      erros.push('Dados do usuário não encontrados');
    }

    if (!dados.habitos || !Array.isArray(dados.habitos)) {
      erros.push('Lista de hábitos inválida ou não encontrada');
    }

    if (!dados.progressos || !Array.isArray(dados.progressos)) {
      erros.push('Lista de progressos inválida ou não encontrada');
    }

    if (!dados.conquistas || !Array.isArray(dados.conquistas)) {
      erros.push('Lista de conquistas inválida ou não encontrada');
    }

    // Validar estrutura dos hábitos
    if (dados.habitos) {
      dados.habitos.forEach((habito, index) => {
        if (!habito.titulo) {
          erros.push(`Hábito ${index + 1}: título é obrigatório`);
        }
        if (!habito.frequencia) {
          erros.push(`Hábito ${index + 1}: frequência é obrigatória`);
        }
      });
    }

    // Validar estrutura dos progressos
    if (dados.progressos) {
      dados.progressos.forEach((progresso, index) => {
        if (!progresso.data) {
          erros.push(`Progresso ${index + 1}: data é obrigatória`);
        }
        if (!progresso.status) {
          erros.push(`Progresso ${index + 1}: status é obrigatório`);
        }
      });
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  // Obter estatísticas de exportação
  static async obterEstatisticasExportacao (usuarioId) {
    try {
      const [totalHabitos, totalProgressos, totalConquistas] = await Promise.all([
        Habito.countDocuments({ idUsuario: usuarioId }),
        Progresso.countDocuments({ idUsuario: usuarioId }),
        Conquista.countDocuments({ idUsuario: usuarioId })
      ]);

      const tamanhoEstimado = {
        habitos: totalHabitos * 0.5, // KB
        progressos: totalProgressos * 0.3, // KB
        conquistas: totalConquistas * 0.4, // KB
        total: (totalHabitos * 0.5 + totalProgressos * 0.3 + totalConquistas * 0.4) / 1024 // MB
      };

      return {
        totalRegistros: {
          habitos: totalHabitos,
          progressos: totalProgressos,
          conquistas: totalConquistas
        },
        tamanhoEstimado,
        ultimaExportacao: null, // Implementar se necessário
        formatosDisponiveis: ['json', 'xml', 'zip']
      };
    } catch (erro) {
      console.error('Erro ao obter estatísticas de exportação:', erro);
      throw erro;
    }
  }
}

module.exports = DataExportService;
