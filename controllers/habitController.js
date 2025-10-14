const Habito = require('../models/Habit');
const Progresso = require('../models/Progress');
const logger = require('../utils/logger');

exports.listar = async (req, res) => {
  const requestId = req.requestId;
  const startTime = Date.now();
  
  try {
    logger.debugLog('Iniciando listagem de hábitos', {
      requestId,
      userId: req.usuario._id,
      query: req.query
    });

    const { ativo, categoria, dificuldade } = req.query;
    const filtros = { idUsuario: req.usuario._id };
    
    // Log de validação dos filtros
    if (ativo !== undefined) {
      filtros.ativo = ativo === 'true';
      logger.validationResult(true, 'ativo', ativo, 'boolean conversion');
    }
    if (categoria) {
      filtros.categoria = categoria;
      logger.validationResult(true, 'categoria', categoria, 'string validation');
    }
    if (dificuldade) {
      filtros.dificuldade = dificuldade;
      logger.validationResult(true, 'dificuldade', dificuldade, 'enum validation');
    }

    logger.dbOperation('find', 'habitos', { filtros });
    const habitos = await Habito.find(filtros).sort({ createdAt: -1 });
    
    const duration = Date.now() - startTime;
    logger.habit('Hábitos listados com sucesso', {
      requestId,
      userId: req.usuario._id,
      total: habitos.length,
      filtros,
      duration: `${duration}ms`
    });

    res.json({ sucesso: true, mensagem: `🗡️ ${habitos.length} hábitos encontrados`, habitos });
  } catch (erro) {
    const duration = Date.now() - startTime;
    logger.errorLog('Erro ao listar hábitos', {
      requestId,
      userId: req.usuario._id,
      error: erro.message,
      stack: erro.stack,
      duration: `${duration}ms`
    });
    
    res.status(500).json({ 
      erro: 'Erro interno do servidor', 
      mensagem: '💀 Não foi possível carregar os hábitos...',
      requestId
    });
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
  const requestId = req.requestId;
  const startTime = Date.now();
  
  try {
    logger.debugLog('Iniciando conclusão de hábito', {
      requestId,
      userId: req.usuario._id,
      habitId: req.params.id,
      body: req.body
    });

    const { observacoes, data } = req.body;
    
    // Validação e processamento da data
    const dataProgresso = data ? new Date(data) : new Date();
    dataProgresso.setHours(0, 0, 0, 0);
    
    logger.validationResult(true, 'data', dataProgresso.toISOString(), 'date processing');
    
    // Buscar hábito
    logger.dbOperation('findOne', 'habitos', { 
      _id: req.params.id, 
      idUsuario: req.usuario._id 
    });
    const habito = await Habito.findOne({ _id: req.params.id, idUsuario: req.usuario._id });
    
    if (!habito) {
      logger.validation('Hábito não encontrado', {
        requestId,
        userId: req.usuario._id,
        habitId: req.params.id
      });
      return res.status(404).json({ 
        erro: 'Hábito não encontrado', 
        mensagem: '🌑 Este hábito não existe no seu arsenal',
        requestId
      });
    }

    logger.habit('Hábito encontrado', {
      requestId,
      habitId: habito._id,
      titulo: habito.titulo,
      dificuldade: habito.dificuldade,
      recompensaXP: habito.recompensaExperiencia
    });

    // Verificar se já existe progresso para a data
    logger.dbOperation('findOne', 'progressos', { 
      idHabito: habito._id, 
      data: dataProgresso 
    });
    const progressoExistente = await Progresso.findOne({ idHabito: habito._id, data: dataProgresso });
    
    if (progressoExistente) {
      logger.validation('Progresso já registrado', {
        requestId,
        userId: req.usuario._id,
        habitId: habito._id,
        data: dataProgresso.toISOString()
      });
      return res.status(400).json({ 
        erro: 'Progresso já registrado', 
        mensagem: '⚔️ Você já completou este hábito hoje!',
        requestId
      });
    }

    // Criar novo progresso
    const novoProgresso = new Progresso({
      idHabito: habito._id,
      idUsuario: req.usuario._id,
      data: dataProgresso,
      status: 'concluido',
      observacoes,
      experienciaGanha: habito.recompensaExperiencia,
      dificuldade: habito.dificuldade
    });

    logger.dbOperation('save', 'progressos', {
      habitId: habito._id,
      userId: req.usuario._id,
      data: dataProgresso.toISOString(),
      experienciaGanha: habito.recompensaExperiencia
    });
    await novoProgresso.save();

    // Atualizar estatísticas do hábito
    habito.estatisticas.totalConclusoes += 1;
    habito.atualizarSequencia(true);
    habito.atualizarEstatisticas();
    
    logger.dbOperation('save', 'habitos', {
      habitId: habito._id,
      totalConclusoes: habito.estatisticas.totalConclusoes,
      sequenciaAtual: habito.sequencia.atual,
      maiorSequencia: habito.sequencia.maiorSequencia
    });
    await habito.save();

    // Adicionar experiência ao usuário
    const nivelAnterior = req.usuario.nivel;
    await req.usuario.adicionarExperiencia(habito.recompensaExperiencia);
    
    logger.business('Hábito concluído com sucesso', {
      requestId,
      userId: req.usuario._id,
      habitId: habito._id,
      experienciaGanha: habito.recompensaExperiencia,
      nivelAnterior,
      nivelNovo: req.usuario.nivel,
      totalConclusoes: habito.estatisticas.totalConclusoes,
      sequenciaAtual: habito.sequencia.atual
    });

    const duration = Date.now() - startTime;
    logger.performance('Conclusão de hábito processada', {
      requestId,
      duration: `${duration}ms`,
      operacoes: ['find_habito', 'check_progresso', 'create_progresso', 'update_habito', 'update_user']
    });

    res.json({
      sucesso: true,
      mensagem: `🎮 +${habito.recompensaExperiencia} XP! Hábito concluído com sucesso!`,
      progresso: novoProgresso,
      experienciaGanha: habito.recompensaExperiencia,
      novoNivel: req.usuario.nivel,
      requestId
    });
  } catch (erro) {
    const duration = Date.now() - startTime;
    logger.errorLog('Erro ao concluir hábito', {
      requestId,
      userId: req.usuario._id,
      habitId: req.params.id,
      error: erro.message,
      stack: erro.stack,
      duration: `${duration}ms`
    });
    
    res.status(500).json({ 
      erro: 'Erro interno do servidor', 
      mensagem: '💀 Não foi possível registrar a conclusão...',
      requestId
    });
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


