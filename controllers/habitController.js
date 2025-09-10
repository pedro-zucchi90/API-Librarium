const Habito = require('../models/Habit');
const Progresso = require('../models/Progress');

exports.listar = async (req, res) => {
  try {
    const { ativo, categoria, dificuldade } = req.query;
    const filtros = { idUsuario: req.usuario._id };
    if (ativo !== undefined) {filtros.ativo = ativo === 'true'};
    if (categoria) {filtros.categoria = categoria};
    if (dificuldade) {filtros.dificuldade = dificuldade};
    const habitos = await Habito.find(filtros).sort({ createdAt: -1 });
    res.json({ sucesso: true, mensagem: `🗡️ ${habitos.length} hábitos encontrados`, habitos });
  } catch (erro) {
    console.error('Erro ao listar hábitos:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar os hábitos...' });
  }
};

exports.obter = async (req, res) => {
  try {
    const habito = await Habito.findOne({ _id: req.params.id, idUsuario: req.usuario._id });
    if (!habito) {
      return res.status(404).json({ erro: 'Hábito não encontrado', mensagem: '🌑 Este hábito não existe no seu arsenal' });
    }
    res.json({ sucesso: true, habito });
  } catch (erro) {
    console.error('Erro ao obter hábito:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar este hábito...' });
  }
};

exports.criar = async (req, res) => {
  try {
    const { titulo, descricao, frequencia, categoria, dificuldade, icone, cor, diasAlvo, horarioLembrete } = req.body;
    const novoHabito = new Habito({
      idUsuario: req.usuario._id,
      titulo,
      descricao,
      frequencia: frequencia || 'diario',
      categoria: categoria || 'pessoal',
      dificuldade: dificuldade || 'medio',
      icone: icone || 'espada',
      cor: cor || '#8B5CF6',
      diasAlvo: diasAlvo || [],
      horarioLembrete
    });
    await novoHabito.save();
    res.status(201).json({ sucesso: true, mensagem: '⚔️ Novo hábito forjado com sucesso!', habito: novoHabito });
  } catch (erro) {
    console.error('Erro ao criar hábito:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível forjar este hábito...' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { titulo, descricao, frequencia, categoria, dificuldade, icone, cor, diasAlvo, horarioLembrete, ativo } = req.body;
    const habito = await Habito.findOne({ _id: req.params.id, idUsuario: req.usuario._id });
    if (!habito) {
      return res.status(404).json({ erro: 'Hábito não encontrado', mensagem: '🌑 Este hábito não existe no seu arsenal' });
    }
    if (titulo !== undefined) {habito.titulo = titulo};
    if (descricao !== undefined) {habito.descricao = descricao};
    if (frequencia !== undefined) {habito.frequencia = frequencia};
    if (categoria !== undefined) {habito.categoria = categoria};
    if (dificuldade !== undefined) {habito.dificuldade = dificuldade};
    if (icone !== undefined) {habito.icone = icone};
    if (cor !== undefined) {habito.cor = cor};
    if (diasAlvo !== undefined) {habito.diasAlvo = diasAlvo};
    if (horarioLembrete !== undefined) {habito.horarioLembrete = horarioLembrete};
    if (ativo !== undefined) {habito.ativo = ativo};
    await habito.save();
    res.json({ sucesso: true, mensagem: '🗡️ Hábito aprimorado com sucesso!', habito });
  } catch (erro) {
    console.error('Erro ao atualizar hábito:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível aprimorar este hábito...' });
  }
};

exports.deletar = async (req, res) => {
  try {
    const habito = await Habito.findOne({ _id: req.params.id, idUsuario: req.usuario._id });
    if (!habito) {
      return res.status(404).json({ erro: 'Hábito não encontrado', mensagem: '🌑 Este hábito não existe no seu arsenal' });
    }
    await Progresso.deleteMany({ idHabito: habito._id });
    await Habito.findByIdAndDelete(habito._id);
    res.json({ sucesso: true, mensagem: '💀 Hábito banido das sombras...' });
  } catch (erro) {
    console.error('Erro ao deletar hábito:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível banir este hábito...' });
  }
};

exports.concluir = async (req, res) => {
  try {
    const { observacoes, data } = req.body;
    const dataProgresso = data ? new Date(data) : new Date();
    dataProgresso.setHours(0, 0, 0, 0);
    const habito = await Habito.findOne({ _id: req.params.id, idUsuario: req.usuario._id });
    if (!habito) {
      return res.status(404).json({ erro: 'Hábito não encontrado', mensagem: '🌑 Este hábito não existe no seu arsenal' });
    }
    const progressoExistente = await Progresso.findOne({ idHabito: habito._id, data: dataProgresso });
    if (progressoExistente) {
      return res.status(400).json({ erro: 'Progresso já registrado', mensagem: '⚔️ Você já completou este hábito hoje!' });
    }
    const novoProgresso = new Progresso({
      idHabito: habito._id,
      idUsuario: req.usuario._id,
      data: dataProgresso,
      status: 'concluido',
      observacoes,
      experienciaGanha: habito.recompensaExperiencia,
      dificuldade: habito.dificuldade
    });
    await novoProgresso.save();
    habito.estatisticas.totalConclusoes += 1;
    habito.atualizarSequencia(true);
    habito.atualizarEstatisticas();
    await habito.save();
    await req.usuario.adicionarExperiencia(habito.recompensaExperiencia);
    res.json({
      sucesso: true,
      mensagem: `🎮 +${habito.recompensaExperiencia} XP! Hábito concluído com sucesso!`,
      progresso: novoProgresso,
      experienciaGanha: habito.recompensaExperiencia,
      novoNivel: req.usuario.nivel
    });
  } catch (erro) {
    console.error('Erro ao concluir hábito:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível registrar a conclusão...' });
  }
};

exports.obterProgresso = async (req, res) => {
  try {
    const { dataInicio, dataFim, limite } = req.query;
    const filtros = { idHabito: req.params.id };
    if (dataInicio || dataFim) {
      filtros.data = {};
      if (dataInicio) {filtros.data.$gte = new Date(dataInicio)};
      if (dataFim) {filtros.data.$lte = new Date(dataFim)};
    }
    let query = Progresso.find(filtros).sort({ data: -1 });
    if (limite) {query = query.limit(parseInt(limite))};
    const progressos = await query;
    res.json({ sucesso: true, mensagem: `📊 ${progressos.length} registros de progresso encontrados`, progressos });
  } catch (erro) {
    console.error('Erro ao obter progresso:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar o progresso...' });
  }
};


