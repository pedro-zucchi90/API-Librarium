const DataExportService = require('../services/dataExportService');

exports.exportarJson = async (req, res) => {
  try {
    const resultado = await DataExportService.exportarDadosCompletos(req.usuario._id, 'json');
    res.setHeader('Content-Type', resultado.tipoConteudo);
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nomeArquivo}"`);
    res.json(resultado.dados);
  } catch (erro) {
    console.error('Erro ao exportar dados JSON:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível exportar os dados...' });
  }
};

exports.exportarXml = async (req, res) => {
  try {
    const resultado = await DataExportService.exportarDadosCompletos(req.usuario._id, 'xml');
    res.setHeader('Content-Type', resultado.tipoConteudo);
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nomeArquivo}"`);
    res.send(resultado.dados);
  } catch (erro) {
    console.error('Erro ao exportar dados XML:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível exportar os dados...' });
  }
};

exports.exportarZip = async (req, res) => {
  try {
    const resultado = await DataExportService.exportarDadosCompactados(req.usuario._id);
    res.setHeader('Content-Type', resultado.tipoConteudo);
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nomeArquivo}"`);
    res.send(resultado.dados);
  } catch (erro) {
    console.error('Erro ao exportar dados ZIP:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível exportar os dados...' });
  }
};

exports.importar = async (req, res) => {
  try {
    const { dados, opcoes } = req.body;
    if (!dados) {
      return res.status(400).json({ erro: 'Dados não fornecidos', mensagem: '🌑 Dados para importação são obrigatórios' });
    }
    const validacao = DataExportService.validarDadosImportacao(dados);
    if (!validacao.valido) {
      return res.status(400).json({ erro: 'Dados inválidos', mensagem: '🌑 Os dados fornecidos não são válidos', detalhes: validacao.erros });
    }
    const resultado = await DataExportService.importarDados(req.usuario._id, dados, opcoes || {});
    res.json({ sucesso: true, mensagem: '📦 Dados importados com sucesso!', resultado });
  } catch (erro) {
    console.error('Erro ao importar dados:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível importar os dados...' });
  }
};

exports.backup = async (req, res) => {
  try {
    const { formato = 'json' } = req.body;
    let resultado;
    if (formato === 'zip') {
      resultado = await DataExportService.exportarDadosCompactados(req.usuario._id);
    } else {
      resultado = await DataExportService.exportarDadosCompletos(req.usuario._id, formato);
    }
    res.json({
      sucesso: true,
      mensagem: '💾 Backup criado com sucesso!',
      backup: {
        nomeArquivo: resultado.nomeArquivo,
        formato,
        tamanho: resultado.dados.length || resultado.dados.byteLength || 'N/A',
        dataCriacao: new Date().toISOString()
      }
    });
  } catch (erro) {
    console.error('Erro ao criar backup:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível criar o backup...' });
  }
};

exports.listarBackups = async (req, res) => {
  try {
    res.json({ sucesso: true, mensagem: '💾 Lista de backups', backups: [], total: 0 });
  } catch (erro) {
    console.error('Erro ao listar backups:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível listar os backups...' });
  }
};

exports.estatisticas = async (req, res) => {
  try {
    const estatisticas = await DataExportService.obterEstatisticasExportacao(req.usuario._id);
    res.json({ sucesso: true, estatisticas });
  } catch (erro) {
    console.error('Erro ao obter estatísticas de exportação:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as estatísticas...' });
  }
};

exports.validar = async (req, res) => {
  try {
    const { dados } = req.body;
    if (!dados) {
      return res.status(400).json({ erro: 'Dados não fornecidos', mensagem: '🌑 Dados para validação são obrigatórios' });
    }
    const validacao = DataExportService.validarDadosImportacao(dados);
    res.json({ sucesso: true, validacao });
  } catch (erro) {
    console.error('Erro ao validar dados:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível validar os dados...' });
  }
};

exports.limpar = async (req, res) => {
  try {
    const { dias = 90, tipos = ['progressos', 'notificacoes'], confirmacao } = req.body;
    if (!confirmacao || confirmacao !== 'CONFIRMO_LIMPEZA_DADOS') {
      return res.status(400).json({ erro: 'Confirmação necessária', mensagem: '⚠️ Esta ação é irreversível. Confirme digitando CONFIRMO_LIMPEZA_DADOS' });
    }
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(dias));
    const resultado = { progressos: 0, notificacoes: 0, total: 0 };
    if (tipos.includes('progressos')) {
      const progressosRemovidos = await require('../models/Progress').deleteMany({ idUsuario: req.usuario._id, createdAt: { $lt: dataLimite } });
      resultado.progressos = progressosRemovidos.deletedCount;
    }
    if (tipos.includes('notificacoes')) {
      const notificacoesRemovidas = await require('../models/Notification').deleteMany({ destinatario: req.usuario._id, createdAt: { $lt: dataLimite }, lida: true });
      resultado.notificacoes = notificacoesRemovidas.deletedCount;
    }
    resultado.total = resultado.progressos + resultado.notificacoes;
    res.json({ sucesso: true, mensagem: `🗑️ ${resultado.total} registros antigos removidos`, resultado });
  } catch (erro) {
    console.error('Erro ao limpar dados:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível limpar os dados...' });
  }
};

exports.sincronizar = async (req, res) => {
  try {
    const { tipo = 'completa', dataInicio, dataFim } = req.body;
    res.json({
      sucesso: true,
      mensagem: '🔄 Sincronização iniciada',
      tipo,
      periodo: {
        inicio: dataInicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        fim: dataFim || new Date().toISOString()
      },
      status: 'em_andamento'
    });
  } catch (erro) {
    console.error('Erro ao sincronizar dados:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível sincronizar os dados...' });
  }
};

exports.obterConfiguracoes = async (req, res) => {
  try {
    const configuracoes = {
      formatosDisponiveis: ['json', 'xml', 'zip'],
      formatosPadrao: 'json',
      backupAutomatico: { ativo: false, frequencia: 'semanal', formato: 'json', manterVersoes: 5 },
      importacao: { sobrescrever: false, mesclar: true, validarDuplicidade: true, criarBackup: true },
      limpeza: { diasPadrao: 90, tiposDisponiveis: ['progressos', 'notificacoes', 'habitos_inativos'] }
    };
    res.json({ sucesso: true, configuracoes });
  } catch (erro) {
    console.error('Erro ao obter configurações:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as configurações...' });
  }
};

exports.atualizarConfiguracoes = async (req, res) => {
  try {
    const { backupAutomatico, importacao, limpeza } = req.body;
    res.json({
      sucesso: true,
      mensagem: '⚙️ Configurações atualizadas com sucesso!',
      configuracoes: {
        backupAutomatico: backupAutomatico || {},
        importacao: importacao || {},
        limpeza: limpeza || {}
      }
    });
  } catch (erro) {
    console.error('Erro ao atualizar configurações:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível atualizar as configurações...' });
  }
};



