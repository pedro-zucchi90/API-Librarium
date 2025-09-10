const Usuario = require('../models/User');
const Conquista = require('../models/Achievement');
const logger = require('../utils/logger');

class AvatarService {
  // Verificar e aplicar evolução automática do avatar
  static async verificarEvolucaoAvatar(usuarioId) {
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) return null;

      const evolucoesAplicadas = [];

      // Verificar evolução baseada no nível
      const evolucaoNivel = await this.verificarEvolucaoPorNivel(usuario);
      if (evolucaoNivel) {
        evolucoesAplicadas.push(evolucaoNivel);
      }

      // Verificar evolução baseada em conquistas
      const evolucaoConquistas = await this.verificarEvolucaoPorConquistas(usuario);
      if (evolucaoConquistas) {
        evolucoesAplicadas.push(evolucaoConquistas);
      }

      // Verificar desbloqueios de equipamentos
      const desbloqueiosEquipamento = await this.verificarDesbloqueiosEquipamento(usuario);
      evolucoesAplicadas.push(...desbloqueiosEquipamento);

      // Salvar mudanças
      if (evolucoesAplicadas.length > 0) {
        await usuario.save();
        logger.info(`Avatar do usuário ${usuarioId} evoluiu: ${evolucoesAplicadas.length} mudanças aplicadas`);
      }

      return {
        sucesso: true,
        evolucoesAplicadas,
        avatar: usuario.avatar,
        personalizacao: usuario.personalizacaoAvatar
      };
    } catch (erro) {
      logger.error('Erro ao verificar evolução do avatar:', erro);
      throw erro;
    }
  }

  // Verificar evolução baseada no nível
  static async verificarEvolucaoPorNivel(usuario) {
    const nivel = usuario.nivel;
    const avatarAtual = usuario.avatar.tipo;
    let evolucao = null;

    if (nivel >= 50 && avatarAtual !== 'conjurador_supremo') {
      usuario.avatar.tipo = 'conjurador_supremo';
      usuario.avatar.evolucao = 'suprema';
      usuario.avatar.nivel = 5;
      usuario.avatar.desbloqueadoEm = new Date();
      evolucao = {
        tipo: 'nivel',
        descricao: 'Avatar evoluiu para Conjurador Supremo!',
        nivel: 5
      };
    } else if (nivel >= 40 && avatarAtual !== 'conjurador_avancado') {
      usuario.avatar.tipo = 'conjurador_avancado';
      usuario.avatar.evolucao = 'avancada';
      usuario.avatar.nivel = 4;
      usuario.avatar.desbloqueadoEm = new Date();
      evolucao = {
        tipo: 'nivel',
        descricao: 'Avatar evoluiu para Conjurador Avançado!',
        nivel: 4
      };
    } else if (nivel >= 31 && avatarAtual !== 'conjurador') {
      usuario.avatar.tipo = 'conjurador';
      usuario.avatar.evolucao = 'evoluida';
      usuario.avatar.nivel = 3;
      usuario.avatar.desbloqueadoEm = new Date();
      evolucao = {
        tipo: 'nivel',
        descricao: 'Avatar evoluiu para Conjurador!',
        nivel: 3
      };
    } else if (nivel >= 21 && avatarAtual !== 'guardiao') {
      usuario.avatar.tipo = 'guardiao';
      usuario.avatar.evolucao = 'intermediaria';
      usuario.avatar.nivel = 2;
      usuario.avatar.desbloqueadoEm = new Date();
      evolucao = {
        tipo: 'nivel',
        descricao: 'Avatar evoluiu para Guardião!',
        nivel: 2
      };
    } else if (nivel >= 11 && avatarAtual !== 'cacador') {
      usuario.avatar.tipo = 'cacador';
      usuario.avatar.evolucao = 'inicial';
      usuario.avatar.nivel = 1;
      usuario.avatar.desbloqueadoEm = new Date();
      evolucao = {
        tipo: 'nivel',
        descricao: 'Avatar evoluiu para Caçador!',
        nivel: 1
      };
    }

    return evolucao;
  }

  // Verificar evolução baseada em conquistas
  static async verificarEvolucaoPorConquistas(usuario) {
    try {
      const conquistas = await Conquista.find({
        idUsuario: usuario._id,
        desbloqueadaEm: { $exists: true }
      });

      const totalConquistas = conquistas.length;
      const conquistasLendarias = conquistas.filter(c => c.raridade === 'lendario').length;
      const conquistasEpicas = conquistas.filter(c => c.raridade === 'epico').length;

      let evolucao = null;

      // Desbloquear equipamentos baseados em conquistas
      if (totalConquistas >= 50 && usuario.personalizacaoAvatar.arma.nivel < 5) {
        usuario.desbloquearItemAvatar('arma', 'espada_lendaria', 5);
        evolucao = {
          tipo: 'conquista',
          descricao: 'Espada Lendária desbloqueada por 50+ conquistas!',
          equipamento: 'arma'
        };
      } else if (totalConquistas >= 30 && usuario.personalizacaoAvatar.arma.nivel < 4) {
        usuario.desbloquearItemAvatar('arma', 'espada_epica', 4);
        evolucao = {
          tipo: 'conquista',
          descricao: 'Espada Épica desbloqueada por 30+ conquistas!',
          equipamento: 'arma'
        };
      } else if (totalConquistas >= 20 && usuario.personalizacaoAvatar.arma.nivel < 3) {
        usuario.desbloquearItemAvatar('arma', 'espada_rara', 3);
        evolucao = {
          tipo: 'conquista',
          descricao: 'Espada Rara desbloqueada por 20+ conquistas!',
          equipamento: 'arma'
        };
      }

      // Desbloquear armadura baseada em conquistas épicas
      if (conquistasEpicas >= 10 && usuario.personalizacaoAvatar.armadura.nivel < 5) {
        usuario.desbloquearItemAvatar('armadura', 'armadura_epica', 5);
        evolucao = {
          tipo: 'conquista',
          descricao: 'Armadura Épica desbloqueada por 10+ conquistas épicas!',
          equipamento: 'armadura'
        };
      } else if (conquistasEpicas >= 5 && usuario.personalizacaoAvatar.armadura.nivel < 4) {
        usuario.desbloquearItemAvatar('armadura', 'armadura_rara', 4);
        evolucao = {
          tipo: 'conquista',
          descricao: 'Armadura Rara desbloqueada por 5+ conquistas épicas!',
          equipamento: 'armadura'
        };
      }

      // Desbloquear acessórios baseados em conquistas lendárias
      if (conquistasLendarias >= 3 && usuario.personalizacaoAvatar.acessorio.nivel < 5) {
        usuario.desbloquearItemAvatar('acessorio', 'coroa_lendaria', 5);
        evolucao = {
          tipo: 'conquista',
          descricao: 'Coroa Lendária desbloqueada por 3+ conquistas lendárias!',
          equipamento: 'acessorio'
        };
      } else if (conquistasLendarias >= 1 && usuario.personalizacaoAvatar.acessorio.nivel < 4) {
        usuario.desbloquearItemAvatar('acessorio', 'coroa_epica', 4);
        evolucao = {
          tipo: 'conquista',
          descricao: 'Coroa Épica desbloqueada por conquista lendária!',
          equipamento: 'acessorio'
        };
      }

      return evolucao;
    } catch (erro) {
      logger.error('Erro ao verificar evolução por conquistas:', erro);
      return null;
    }
  }

  // Verificar desbloqueios de equipamentos baseados em sequências
  static async verificarDesbloqueiosEquipamento(usuario) {
    const desbloqueios = [];

    // Desbloquear equipamentos baseados em sequência
    if (usuario.sequencia.maiorSequencia >= 100 && usuario.personalizacaoAvatar.arma.nivel < 5) {
      usuario.desbloquearItemAvatar('arma', 'espada_sequencia', 5);
      desbloqueios.push({
        tipo: 'sequencia',
        descricao: 'Espada da Sequência desbloqueada por 100+ dias consecutivos!',
        equipamento: 'arma'
      });
    } else if (usuario.sequencia.maiorSequencia >= 50 && usuario.personalizacaoAvatar.arma.nivel < 4) {
      usuario.desbloquearItemAvatar('arma', 'espada_persistencia', 4);
      desbloqueios.push({
        tipo: 'sequencia',
        descricao: 'Espada da Persistência desbloqueada por 50+ dias consecutivos!',
        equipamento: 'arma'
      });
    }

    // Desbloquear armadura baseada em XP total
    if (usuario.experiencia >= 10000 && usuario.personalizacaoAvatar.armadura.nivel < 5) {
      usuario.desbloquearItemAvatar('armadura', 'armadura_experiencia', 5);
      desbloqueios.push({
        tipo: 'experiencia',
        descricao: 'Armadura da Experiência desbloqueada por 10k+ XP!',
        equipamento: 'armadura'
      });
    } else if (usuario.experiencia >= 5000 && usuario.personalizacaoAvatar.armadura.nivel < 4) {
      usuario.desbloquearItemAvatar('armadura', 'armadura_conhecimento', 4);
      desbloqueios.push({
        tipo: 'experiencia',
        descricao: 'Armadura do Conhecimento desbloqueada por 5k+ XP!',
        equipamento: 'armadura'
      });
    }

    return desbloqueios;
  }

  // Obter estatísticas do avatar
  static async obterEstatisticasAvatar(usuarioId) {
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) return null;

      const avatar = usuario.avatar;
      const personalizacao = usuario.personalizacaoAvatar;

      return {
        avatar: {
          tipo: avatar.tipo,
          nivel: avatar.nivel,
          evolucao: avatar.evolucao,
          desbloqueadoEm: avatar.desbloqueadoEm
        },
        equipamentos: {
          arma: {
            tipo: personalizacao.arma.tipo,
            nivel: personalizacao.arma.nivel,
            desbloqueadaEm: personalizacao.arma.desbloqueadaEm
          },
          armadura: {
            tipo: personalizacao.armadura.tipo,
            nivel: personalizacao.armadura.nivel,
            desbloqueadaEm: personalizacao.armadura.desbloqueadaEm
          },
          acessorio: {
            tipo: personalizacao.acessorio.tipo,
            nivel: personalizacao.acessorio.nivel,
            desbloqueadaEm: personalizacao.acessorio.desbloqueadaEm
          }
        },
        efeitos: {
          aura: {
            tipo: personalizacao.aura.tipo,
            intensidade: personalizacao.aura.intensidade,
            desbloqueadaEm: personalizacao.aura.desbloqueadaEm
          },
          particulas: {
            tipo: personalizacao.particulas.tipo,
            quantidade: personalizacao.particulas.quantidade,
            desbloqueadaEm: personalizacao.particulas.desbloqueadaEm
          }
        },
        progresso: {
          nivelAvatar: avatar.nivel,
          nivelMaximo: 5,
          proximaEvolucao: this.obterProximaEvolucao(avatar.nivel),
          equipamentosDesbloqueados: this.contarEquipamentosDesbloqueados(personalizacao)
        }
      };
    } catch (erro) {
      logger.error('Erro ao obter estatísticas do avatar:', erro);
      throw erro;
    }
  }

  // Obter próxima evolução disponível
  static obterProximaEvolucao(nivelAtual) {
    if (nivelAtual >= 5) return null;
    
    const evolucoes = [
      { nivel: 1, nome: 'Caçador', requisito: 'Nível 11' },
      { nivel: 2, nome: 'Guardião', requisito: 'Nível 21' },
      { nivel: 3, nome: 'Conjurador', requisito: 'Nível 31' },
      { nivel: 4, nome: 'Conjurador Avançado', requisito: 'Nível 40' },
      { nivel: 5, nome: 'Conjurador Supremo', requisito: 'Nível 50' }
    ];

    return evolucoes.find(e => e.nivel === nivelAtual + 1);
  }

  // Contar equipamentos desbloqueados
  static contarEquipamentosDesbloqueados(personalizacao) {
    let total = 0;
    let porNivel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    Object.values(personalizacao).forEach(item => {
      if (item.tipo && item.tipo !== 'nenhum' && item.tipo !== 'nenhuma') {
        total++;
        if (porNivel[item.nivel]) {
          porNivel[item.nivel]++;
        }
      }
    });

    return { total, porNivel };
  }

  // Aplicar tema visual baseado no avatar
  static obterTemaVisual(avatar) {
    const temas = {
      'aspirante': {
        corPrimaria: '#6B7280',
        corSecundaria: '#9CA3AF',
        corDestaque: '#D1D5DB',
        gradiente: 'linear-gradient(135deg, #6B7280, #9CA3AF)'
      },
      'cacador': {
        corPrimaria: '#059669',
        corSecundaria: '#10B981',
        corDestaque: '#34D399',
        gradiente: 'linear-gradient(135deg, #059669, #10B981)'
      },
      'guardiao': {
        corPrimaria: '#1D4ED8',
        corSecundaria: '#3B82F6',
        corDestaque: '#60A5FA',
        gradiente: 'linear-gradient(135deg, #1D4ED8, #3B82F6)'
      },
      'conjurador': {
        corPrimaria: '#7C3AED',
        corSecundaria: '#8B5CF6',
        corDestaque: '#A78BFA',
        gradiente: 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
      },
      'conjurador_avancado': {
        corPrimaria: '#DC2626',
        corSecundaria: '#EF4444',
        corDestaque: '#F87171',
        gradiente: 'linear-gradient(135deg, #DC2626, #EF4444)'
      },
      'conjurador_supremo': {
        corPrimaria: '#F59E0B',
        corSecundaria: '#FBBF24',
        corDestaque: '#FCD34D',
        gradiente: 'linear-gradient(135deg, #F59E0B, #FBBF24)'
      }
    };

    return temas[avatar.tipo] || temas.aspirante;
  }
}

module.exports = AvatarService;
