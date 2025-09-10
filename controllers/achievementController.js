const AchievementService = require('../services/achievementService');
const Conquista = require('../models/Achievement');

exports.listar = async (req, res) => {
  try {
    const { desbloqueada, categoria, raridade } = req.query;
    const filtros = { idUsuario: req.usuario._id };
    if (desbloqueada !== undefined) {
      filtros.desbloqueadaEm = desbloqueada === 'true' ? { $exists: true } : { $exists: false };
    }
    if (categoria) {filtros.categoria = categoria};
    if (raridade) {filtros.raridade = raridade};
    const conquistas = await Conquista.find(filtros).sort({ desbloqueadaEm: -1, createdAt: -1 });
    res.json({ sucesso: true, mensagem: `🏆 ${conquistas.length} conquistas encontradas`, conquistas });
  } catch (erro) {
    console.error('Erro ao listar conquistas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as conquistas...' });
  }
};

exports.verificar = async (req, res) => {
  try {
    const conquistasDesbloqueadas = await AchievementService.verificarConquistas(req.usuario._id);
    res.json({
      sucesso: true,
      mensagem: `🎮 ${conquistasDesbloqueadas.length} conquistas verificadas`,
      conquistasDesbloqueadas,
      resumo: {
        total: conquistasDesbloqueadas.length,
        xpGanho: conquistasDesbloqueadas.reduce((total, c) => total + c.xpGanho, 0),
        subiuNivel: conquistasDesbloqueadas.some(c => c.subiuNivel)
      }
    });
  } catch (erro) {
    console.error('Erro ao verificar conquistas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível verificar as conquistas...' });
  }
};

exports.estatisticas = async (req, res) => {
  try {
    const estatisticas = await AchievementService.obterEstatisticasConquistas(req.usuario._id);
    res.json({ sucesso: true, estatisticas });
  } catch (erro) {
    console.error('Erro ao obter estatísticas de conquistas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as estatísticas...' });
  }
};

exports.criarPersonalizada = async (req, res) => {
  try {
    const { titulo, descricao, tipo, categoria, icone, cor, experienciaRecompensa, raridade, condicoes } = req.body;
    if (!condicoes || !condicoes.tipo || !condicoes.valor) {
      return res.status(400).json({ erro: 'Condições inválidas', mensagem: '🌑 Condições da conquista são obrigatórias' });
    }
    const novaConquista = new Conquista({
      idUsuario: req.usuario._id,
      titulo,
      descricao,
      tipo: tipo || 'personalizada',
      categoria: categoria || 'especial',
      icone: icone || 'medalha',
      cor: cor || '#FFD700',
      experienciaRecompensa: experienciaRecompensa || 50,
      raridade: raridade || 'comum',
      condicoes,
      visivel: true
    });
    await novaConquista.save();
    res.status(201).json({ sucesso: true, mensagem: '🏆 Conquista personalizada criada com sucesso!', conquista: novaConquista });
  } catch (erro) {
    console.error('Erro ao criar conquista personalizada:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível criar a conquista...' });
  }
};

exports.marcarComoLida = async (req, res) => {
  try {
    const conquista = await Conquista.findOne({ _id: req.params.id, idUsuario: req.usuario._id });
    if (!conquista) {
      return res.status(404).json({ erro: 'Conquista não encontrada', mensagem: '🌑 Esta conquista não existe' });
    }
    if (!conquista.desbloqueadaEm) {
      return res.status(400).json({ erro: 'Conquista não desbloqueada', mensagem: '⚔️ Você precisa desbloquear esta conquista primeiro' });
    }
    res.json({ sucesso: true, mensagem: '🏆 Conquista marcada como lida', conquista });
  } catch (erro) {
    console.error('Erro ao marcar conquista como lida:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível marcar a conquista...' });
  }
};

exports.porCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const { desbloqueada } = req.query;
    const filtros = { idUsuario: req.usuario._id, categoria };
    if (desbloqueada !== undefined) {
      filtros.desbloqueadaEm = desbloqueada === 'true' ? { $exists: true } : { $exists: false };
    }
    const conquistas = await Conquista.find(filtros).sort({ desbloqueadaEm: -1, createdAt: -1 });
    res.json({ sucesso: true, mensagem: `🏆 ${conquistas.length} conquistas da categoria ${categoria}`, categoria, conquistas });
  } catch (erro) {
    console.error('Erro ao obter conquistas por categoria:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as conquistas...' });
  }
};

exports.porRaridade = async (req, res) => {
  try {
    const { raridade } = req.params;
    const { desbloqueada } = req.query;
    const filtros = { idUsuario: req.usuario._id, raridade };
    if (desbloqueada !== undefined) {
      filtros.desbloqueadaEm = desbloqueada === 'true' ? { $exists: true } : { $exists: false };
    }
    const conquistas = await Conquista.find(filtros).sort({ desbloqueadaEm: -1, createdAt: -1 });
    res.json({ sucesso: true, mensagem: `🏆 ${conquistas.length} conquistas de raridade ${raridade}`, raridade, conquistas });
  } catch (erro) {
    console.error('Erro ao obter conquistas por raridade:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as conquistas...' });
  }
};

exports.progresso = async (req, res) => {
  try {
    const conquistas = await Conquista.find({ idUsuario: req.usuario._id });
    const progresso = {
      total: conquistas.length,
      desbloqueadas: conquistas.filter(c => c.desbloqueadaEm).length,
      bloqueadas: conquistas.filter(c => !c.desbloqueadaEm).length,
      porcentagem: conquistas.length > 0 ? Math.round((conquistas.filter(c => c.desbloqueadaEm).length / conquistas.length) * 100) : 0,
      porCategoria: {},
      porRaridade: {}
    };
    conquistas.forEach(conquista => {
      if (!progresso.porCategoria[conquista.categoria]) {progresso.porCategoria[conquista.categoria] = { total: 0, desbloqueadas: 0 }};
      progresso.porCategoria[conquista.categoria].total++;
      if (conquista.desbloqueadaEm) {progresso.porCategoria[conquista.categoria].desbloqueadas++};
    });
    conquistas.forEach(conquista => {
      if (!progresso.porRaridade[conquista.raridade]){progresso.porRaridade[conquista.raridade] = { total: 0, desbloqueadas: 0 }};
      progresso.porRaridade[conquista.raridade].total++;
      if (conquista.desbloqueadaEm) {progresso.porRaridade[conquista.raridade].desbloqueadas++};
    });
    res.json({ sucesso: true, progresso });
  } catch (erro) {
    console.error('Erro ao obter progresso das conquistas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar o progresso...' });
  }
};

exports.proximas = async (req, res) => {
  try {
    const conquistasBloqueadas = await Conquista.find({ idUsuario: req.usuario._id, desbloqueadaEm: { $exists: false } }).sort({ experienciaRecompensa: -1 }).limit(5);
    const proximasConquistas = [];
    for (const conquista of conquistasBloqueadas) {
      const proxima = await AchievementService.verificarCondicoesConquista(conquista, req.usuario);
      if (proxima) {
        proximasConquistas.push({ ...conquista.toObject(), proxima: true });
      }
    }
    res.json({ sucesso: true, mensagem: `${proximasConquistas.length} conquistas próximas de serem desbloqueadas`, proximasConquistas });
  } catch (erro) {
    console.error('Erro ao obter próximas conquistas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as próximas conquistas...' });
  }
};


