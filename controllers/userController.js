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
      novoAvatar = 'aspirante';
      novoTitulo = 'Aspirante';
    }
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
    const { arma, armadura, acessorio } = req.body;
    if (arma) {usuario.personalizacaoAvatar.arma = arma};
    if (armadura) {usuario.personalizacaoAvatar.armadura = armadura};
    if (acessorio) {usuario.personalizacaoAvatar.acessorio = acessorio};
    await usuario.save();
    res.json({ sucesso: true, mensagem: 'Visual do avatar atualizado!', personalizacaoAvatar: usuario.personalizacaoAvatar });
  } catch (erro) {
    console.error('Erro ao customizar avatar:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível customizar o avatar...' });
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

exports.dashboard = async (req, res) => {
  try {
    const {usuario} = req;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const habitosAtivos = await Habito.find({ idUsuario: usuario._id, ativo: true });
    const progressoHoje = await Progresso.find({ idUsuario: usuario._id, data: hoje }).populate('idHabito');
    const totalHabitos = habitosAtivos.length;
    const habitosConcluidos = progressoHoje.filter(p => p.status === 'concluido').length;
    const porcentagemConclusao = totalHabitos > 0 ? (habitosConcluidos / totalHabitos) * 100 : 0;
    const conquistasRecentes = await Conquista.find({ idUsuario: usuario._id }).sort({ desbloqueadaEm: -1 }).limit(3);
    res.json({
      sucesso: true,
      dashboard: {
        usuario: { nomeUsuario: usuario.nomeUsuario, nivel: usuario.nivel, experiencia: usuario.experiencia, titulo: usuario.titulo, avatar: usuario.avatar, sequencia: usuario.sequencia },
        estatisticasHoje: { totalHabitos, habitosConcluidos, porcentagemConclusao: Math.round(porcentagemConclusao), experienciaGanhaHoje: progressoHoje.reduce((total, p) => total + p.experienciaGanha, 0) },
        habitos: habitosAtivos.map(habito => {
          const progressoHabito = progressoHoje.find(p => p.idHabito._id.toString() === habito._id.toString());
          return { ...habito.toObject(), concluidoHoje: !!progressoHabito, statusHoje: progressoHabito?.status || 'pendente' };
        }),
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


