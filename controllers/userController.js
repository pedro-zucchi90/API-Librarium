const Usuario = require('../models/User');
const Habito = require('../models/Habit');
const Progresso = require('../models/Progress');
const Conquista = require('../models/Achievement');

exports.evoluirAvatar = async (req, res) => {
  try {
    const {usuario} = req;
    let novoAvatar = usuario.avatar;
    let novoTitulo = usuario.titulo;
    if (usuario.nivel >= 31) {
      novoAvatar = 'conjurador';
      novoTitulo = 'Conjurador Supremo';
    } else if (usuario.nivel >= 21) {
      novoAvatar = 'guardiao';
      novoTitulo = 'Guardião do Librarium';
    } else if (usuario.nivel >= 11) {
      novoAvatar = 'cacador';
      novoTitulo = 'Caçador';
    } else {
      novoAvatar = {
        tipo: 'aspirante',
        nivel: 1,
        evolucao: 'inicial',
        desbloqueadoEm: new Date()
      };
      novoTitulo = 'Aspirante';
    }
    
    // Migrar avatar antigo se necessário
    if (typeof usuario.avatar === 'string') {
      usuario.migrarAvatarAntigo();
    }
    
    // Atualizar avatar
    usuario.avatar = novoAvatar;
    usuario.titulo = novoTitulo;
    await usuario.save();
    res.json({ sucesso: true, mensagem: `Avatar evoluído para ${novoTitulo}!`, avatar: novoAvatar, titulo: novoTitulo, nivel: usuario.nivel });
  } catch (erro) {
    console.error('Erro ao evoluir avatar:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível evoluir o avatar...' });
  }
};

exports.customizarAvatar = async (req, res) => {
  try {
    const {usuario} = req;
    const { personalizacaoAvatar, arma, armadura, acessorio } = req.body;

    // Aceitar tanto o formato novo (personalizacaoAvatar) quanto o antigo (arma, armadura, acessorio)
    if (personalizacaoAvatar && typeof personalizacaoAvatar === 'object') {
      // Formato novo: personalizacaoAvatar como objeto
      // Fazer merge seguro dos dados
      if (personalizacaoAvatar.tema) {
        // Tema não está no schema, mas pode ser usado para outras coisas
        // Por enquanto, apenas armazenamos no personalizacaoAvatar se necessário
      }
      
      // Atualizar campos do personalizacaoAvatar de forma segura
      if (personalizacaoAvatar.head) {
        // Head não está no schema padrão, mas podemos armazenar como parte do acessorio ou criar um campo customizado
        // Por enquanto, vamos armazenar em um campo que já existe
      }
      
      // Atualizar bodyColor se fornecido
      if (personalizacaoAvatar.bodyColor) {
        // BodyColor pode ser usado para personalização visual
      }
      
      // Fazer merge seguro: apenas atualizar campos que existem no schema
      if (personalizacaoAvatar.arma && typeof personalizacaoAvatar.arma === 'object') {
        if (personalizacaoAvatar.arma.tipo) {
          usuario.personalizacaoAvatar.arma.tipo = personalizacaoAvatar.arma.tipo;
        }
        if (personalizacaoAvatar.arma.nivel) {
          usuario.personalizacaoAvatar.arma.nivel = personalizacaoAvatar.arma.nivel;
        }
      }
      
      if (personalizacaoAvatar.armadura && typeof personalizacaoAvatar.armadura === 'object') {
        if (personalizacaoAvatar.armadura.tipo) {
          usuario.personalizacaoAvatar.armadura.tipo = personalizacaoAvatar.armadura.tipo;
        }
        if (personalizacaoAvatar.armadura.nivel) {
          usuario.personalizacaoAvatar.armadura.nivel = personalizacaoAvatar.armadura.nivel;
        }
      }
      
      if (personalizacaoAvatar.acessorio && typeof personalizacaoAvatar.acessorio === 'object') {
        if (personalizacaoAvatar.acessorio.tipo) {
          usuario.personalizacaoAvatar.acessorio.tipo = personalizacaoAvatar.acessorio.tipo;
        }
        if (personalizacaoAvatar.acessorio.nivel) {
          usuario.personalizacaoAvatar.acessorio.nivel = personalizacaoAvatar.acessorio.nivel;
        }
      }
      
      // Armazenar campos customizados (head, tema, bodyColor) no campo custom
      if (!usuario.personalizacaoAvatar.custom || typeof usuario.personalizacaoAvatar.custom !== 'object') {
        usuario.personalizacaoAvatar.custom = {};
      }
      if (personalizacaoAvatar.head) {
        usuario.personalizacaoAvatar.custom.head = personalizacaoAvatar.head;
      }
      if (personalizacaoAvatar.tema) {
        usuario.personalizacaoAvatar.custom.tema = personalizacaoAvatar.tema;
      }
      if (personalizacaoAvatar.bodyColor) {
        usuario.personalizacaoAvatar.custom.bodyColor = personalizacaoAvatar.bodyColor;
      }
    } else {
      // Formato antigo: arma, armadura, acessorio diretos
      if (arma && typeof arma === 'object') {
        if (arma.tipo) usuario.personalizacaoAvatar.arma.tipo = arma.tipo;
        if (arma.nivel) usuario.personalizacaoAvatar.arma.nivel = arma.nivel;
      }
      if (armadura && typeof armadura === 'object') {
        if (armadura.tipo) usuario.personalizacaoAvatar.armadura.tipo = armadura.tipo;
        if (armadura.nivel) usuario.personalizacaoAvatar.armadura.nivel = armadura.nivel;
      }
      if (acessorio && typeof acessorio === 'object') {
        if (acessorio.tipo) usuario.personalizacaoAvatar.acessorio.tipo = acessorio.tipo;
        if (acessorio.nivel) usuario.personalizacaoAvatar.acessorio.nivel = acessorio.nivel;
      }
    }

    // Marcar como modificado para garantir que o Mongoose salve
    usuario.markModified('personalizacaoAvatar');
    
    // Salvar com validação
    await usuario.save({ validateBeforeSave: true });
    
    // Retornar resposta sempre, mesmo em caso de sucesso parcial
    res.json({ 
      sucesso: true, 
      mensagem: 'Visual do avatar atualizado!', 
      personalizacaoAvatar: usuario.personalizacaoAvatar 
    });
  } catch (erro) {
    console.error('Erro ao customizar avatar:', erro);
    
    // Garantir que sempre retornamos uma resposta, mesmo em caso de erro
    // Isso evita que o front-end perca a conexão
    const statusCode = erro.name === 'ValidationError' ? 400 : 500;
    const mensagem = erro.name === 'ValidationError' 
      ? 'Dados inválidos fornecidos para personalização do avatar'
      : '💀 Não foi possível customizar o avatar...';
    
    res.status(statusCode).json({ 
      sucesso: false,
      erro: 'Erro ao customizar avatar', 
      mensagem: mensagem,
      detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined
    });
  }
};

exports.exportar = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).lean();
    const habitos = await Habito.find({ idUsuario: req.usuario._id }).lean();
    const progressos = await Progresso.find({ idUsuario: req.usuario._id }).lean();
    const conquistas = await Conquista.find({ idUsuario: req.usuario._id }).lean();
    const dadosExportados = { usuario, habitos, progressos, conquistas };
    res.setHeader('Content-Disposition', 'attachment; filename="librarium_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(dadosExportados, null, 2));
  } catch (erro) {
    console.error('Erro ao exportar dados:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível exportar os dados...' });
  }
};

exports.importar = async (req, res) => {
  try {
    const { usuario, habitos, progressos, conquistas } = req.body;
    res.json({ sucesso: true, mensagem: '📦 Dados importados/restaurados com sucesso! (simulação)' });
  } catch (erro) {
    console.error('Erro ao importar dados:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível importar os dados...' });
  }
};

// Função auxiliar para obter data atual em UTC (meia-noite)
function obterDataAtualUTC() {
  const agora = new Date();
  const hojeUTC = new Date(Date.UTC(
    agora.getUTCFullYear(),
    agora.getUTCMonth(),
    agora.getUTCDate(),
    0, 0, 0, 0
  ));
  return hojeUTC;
}

// Função para verificar se hábito está travado baseado na frequência
function verificarHabitotravado(habito, ultimoProgresso) {
  if (!ultimoProgresso || !ultimoProgresso.data) {
    return { travado: false };
  }
  
  const agora = new Date();
  const agoraUTC = new Date(Date.UTC(
    agora.getUTCFullYear(),
    agora.getUTCMonth(),
    agora.getUTCDate(),
    agora.getUTCHours(),
    agora.getUTCMinutes(),
    agora.getUTCSeconds()
  ));
  
  const dataUltimoProgresso = new Date(ultimoProgresso.data);
  const dataUltimoProgressoUTC = new Date(Date.UTC(
    dataUltimoProgresso.getUTCFullYear(),
    dataUltimoProgresso.getUTCMonth(),
    dataUltimoProgresso.getUTCDate(),
    0, 0, 0, 0
  ));
  
  const hojeUTC = obterDataAtualUTC();
  
  switch (habito.frequencia) {
    case 'diario': {
      // Travado até o próximo dia (meia-noite UTC)
      const proximoDia = new Date(dataUltimoProgressoUTC);
      proximoDia.setUTCDate(proximoDia.getUTCDate() + 1);
      
      const travado = agoraUTC < proximoDia;
      return {
        travado,
        proximoDesbloqueio: proximoDia.toISOString(),
        mensagem: travado ? 'Você já completou este hábito hoje. Desbloqueia amanhã!' : null
      };
    }
    
    case 'semanal': {
      // Travado até a próxima semana (mesmo dia da semana)
      const proximaSemana = new Date(dataUltimoProgressoUTC);
      proximaSemana.setUTCDate(proximaSemana.getUTCDate() + 7);
      
      const travado = agoraUTC < proximaSemana;
      return {
        travado,
        proximoDesbloqueio: proximaSemana.toISOString(),
        mensagem: travado ? 'Você já completou este hábito esta semana. Desbloqueia na próxima semana!' : null
      };
    }
    
    case 'mensal': {
      // Travado até o próximo mês (mesmo dia)
      const proximoMes = new Date(dataUltimoProgressoUTC);
      proximoMes.setUTCMonth(proximoMes.getUTCMonth() + 1);
      
      const travado = agoraUTC < proximoMes;
      return {
        travado,
        proximoDesbloqueio: proximoMes.toISOString(),
        mensagem: travado ? 'Você já completou este hábito este mês. Desbloqueia no próximo mês!' : null
      };
    }
    
    default:
      return { travado: false };
  }
}

exports.dashboard = async (req, res) => {
  try {
    const {usuario} = req;
    const hojeUTC = obterDataAtualUTC();
    
    // Buscar hábitos ativos
    const habitosAtivos = await Habito.find({ idUsuario: usuario._id, ativo: true });
    
    // Buscar progressos de hoje (comparando por data UTC)
    const progressoHoje = await Progresso.find({ 
      idUsuario: usuario._id,
      data: {
        $gte: hojeUTC,
        $lt: new Date(hojeUTC.getTime() + 24 * 60 * 60 * 1000) // Próximo dia
      }
    }).populate('idHabito');
    
    // Buscar últimos progressos de cada hábito para verificar travamento
    const habitosComStatus = await Promise.all(habitosAtivos.map(async (habito) => {
      // Buscar último progresso concluído deste hábito
      const ultimoProgresso = await Progresso.findOne({
        idHabito: habito._id,
        idUsuario: usuario._id,
        status: 'concluido'
      }).sort({ data: -1 });
      
      // Verificar se está travado
      const statusTravamento = verificarHabitotravado(habito, ultimoProgresso);
      
      // Verificar se foi completado hoje
      const progressoHojeHabito = progressoHoje.find(p => 
        p.idHabito._id.toString() === habito._id.toString()
      );
      
      return {
        ...habito.toObject(),
        concluidoHoje: !!progressoHojeHabito && progressoHojeHabito.status === 'concluido',
        statusHoje: progressoHojeHabito?.status || 'pendente',
        travado: statusTravamento.travado,
        proximoDesbloqueio: statusTravamento.proximoDesbloqueio,
        mensagemTravamento: statusTravamento.mensagem
      };
    }));
    
    const totalHabitos = habitosAtivos.length;
    const habitosConcluidos = progressoHoje.filter(p => p.status === 'concluido').length;
    const porcentagemConclusao = totalHabitos > 0 ? (habitosConcluidos / totalHabitos) * 100 : 0;
    const conquistasRecentes = await Conquista.find({ idUsuario: usuario._id }).sort({ desbloqueadaEm: -1 }).limit(3);
    
    res.json({
      sucesso: true,
      dashboard: {
        usuario: { nomeUsuario: usuario.nomeUsuario, nivel: usuario.nivel, experiencia: usuario.experiencia, titulo: usuario.titulo, avatar: usuario.avatar, sequencia: usuario.sequencia },
        estatisticasHoje: { totalHabitos, habitosConcluidos, porcentagemConclusao: Math.round(porcentagemConclusao), experienciaGanhaHoje: progressoHoje.reduce((total, p) => total + p.experienciaGanha, 0) },
        habitos: habitosComStatus,
        conquistasRecentes
      }
    });
  } catch (erro) {
    console.error('Erro ao carregar dashboard:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar o dashboard...' });
  }
};

exports.estatisticas = async (req, res) => {
  try {
    const { periodo = '30' } = req.query;
    const diasAtras = parseInt(periodo);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    dataInicio.setHours(0, 0, 0, 0);
    const {usuario} = req;
    const progressos = await Progresso.find({ idUsuario: usuario._id, data: { $gte: dataInicio } }).populate('idHabito');
    const totalProgressos = progressos.length;
    const progressosConcluidos = progressos.filter(p => p.status === 'concluido').length;
    const progressosPerdidos = progressos.filter(p => p.status === 'perdido').length;
    const experienciaTotal = progressos.reduce((total, p) => total + p.experienciaGanha, 0);
    const progressoPorCategoria = {};
    progressos.forEach(progresso => {
      const {categoria} = progresso.idHabito;
      if (!progressoPorCategoria[categoria]) {progressoPorCategoria[categoria] = { concluidos: 0, total: 0 }};
      progressoPorCategoria[categoria].total++;
      if (progresso.status === 'concluido') {progressoPorCategoria[categoria].concluidos++};
    });
    const progressoPorDificuldade = {};
    progressos.forEach(progresso => {
      const {dificuldade} = progresso;
      if (!progressoPorDificuldade[dificuldade]) {progressoPorDificuldade[dificuldade] = { concluidos: 0, total: 0 }};
      progressoPorDificuldade[dificuldade].total++;
      if (progresso.status === 'concluido') {progressoPorDificuldade[dificuldade].concluidos++};
    });
    const habitosAtivos = await Habito.find({ idUsuario: usuario._id, ativo: true });
    const sequencias = habitosAtivos.map(habito => ({ habito: habito.titulo, sequenciaAtual: habito.sequencia.atual, maiorSequencia: habito.sequencia.maiorSequencia }));
    res.json({ sucesso: true, estatisticas: { periodo: `${diasAtras} dias`, resumo: { totalProgressos, progressosConcluidos, progressosPerdidos, taxaConclusao: totalProgressos > 0 ? Math.round((progressosConcluidos / totalProgressos) * 100) : 0, experienciaTotal }, progressoPorCategoria, progressoPorDificuldade, sequencias, usuario: { nivel: usuario.nivel, experiencia: usuario.experiencia, titulo: usuario.titulo, sequenciaGeral: usuario.sequencia } } });
  } catch (erro) {
    console.error('Erro ao carregar estatísticas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as estatísticas...' });
  }
};

exports.ranking = async (req, res) => {
  try {
    const { limite = 10 } = req.query;
    const ranking = await Usuario.find({}).select('nomeUsuario nivel experiencia titulo avatar').sort({ experiencia: -1, nivel: -1 }).limit(parseInt(limite));
    const posicaoUsuario = await Usuario.countDocuments({ experiencia: { $gt: req.usuario.experiencia } }) + 1;
    res.json({ sucesso: true, mensagem: `🏆 Top ${limite} caçadores do Librarium`, ranking: ranking.map((usuario, index) => ({ posicao: index + 1, nomeUsuario: usuario.nomeUsuario, nivel: usuario.nivel, experiencia: usuario.experiencia, titulo: usuario.titulo, avatar: usuario.avatar })), usuarioAtual: { posicao: posicaoUsuario, nomeUsuario: req.usuario.nomeUsuario, nivel: req.usuario.nivel, experiencia: req.usuario.experiencia } });
  } catch (erro) {
    console.error('Erro ao carregar ranking:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar o ranking...' });
  }
};

exports.conquistas = async (req, res) => {
  try {
    const conquistas = await Conquista.find({ idUsuario: req.usuario._id }).sort({ desbloqueadaEm: -1 });
    const conquistasPorRaridade = {
      lendario: conquistas.filter(c => c.raridade === 'lendario').length,
      epico: conquistas.filter(c => c.raridade === 'epico').length,
      raro: conquistas.filter(c => c.raridade === 'raro').length,
      comum: conquistas.filter(c => c.raridade === 'comum').length
    };
    res.json({ sucesso: true, mensagem: `🏆 ${conquistas.length} conquistas desbloqueadas`, conquistas, resumo: { total: conquistas.length, porRaridade: conquistasPorRaridade } });
  } catch (erro) {
    console.error('Erro ao carregar conquistas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as conquistas...' });
  }
};

exports.atualizarPreferencias = async (req, res) => {
  try {
    const { notificacoes, tema, idioma } = req.body;
    const {usuario} = req;
    if (notificacoes !== undefined) {usuario.preferencias.notificacoes = notificacoes};
    if (tema !== undefined) {usuario.preferencias.tema = tema};
    if (idioma !== undefined) {usuario.preferencias.idioma = idioma};
    await usuario.save();
    res.json({ sucesso: true, mensagem: '⚙️ Preferências atualizadas com sucesso!', preferencias: usuario.preferencias });
  } catch (erro) {
    console.error('Erro ao atualizar preferências:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível atualizar as preferências...' });
  }
};

exports.adicionarXP = async (req, res) => {
  try {
    const { quantidade } = req.body;
    const {usuario} = req;
    usuario.experiencia += quantidade || 1000;
    await usuario.save();
    res.json({ sucesso: true, mensagem: `✨ ${quantidade || 1000} XP adicionado!`, experiencia: usuario.experiencia, nivel: usuario.nivel });
  } catch (erro) {
    console.error('Erro ao adicionar XP:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível adicionar XP...' });
  }
};


