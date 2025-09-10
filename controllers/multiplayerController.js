const Usuario = require('../models/User');
const Habito = require('../models/Habit');
const Desafio = require('../models/Challenge');
const Mensagem = require('../models/Message');
const Batalha = require('../models/Battle');

exports.criarBatalha = async (req, res) => {
  try {
    const { adversarioId, tipoBatalha, duracao, criterios, configuracao } = req.body;
    const adversario = await Usuario.findById(adversarioId);
    if (!adversario) {
      return res.status(404).json({ erro: 'Adversário não encontrado', mensagem: '🌑 Este caçador não existe no Librarium' });
    }
    if (adversarioId === req.usuario._id.toString()) {
      return res.status(400).json({ erro: 'Batalha inválida', mensagem: '⚔️ Você não pode batalhar consigo mesmo' });
    }
    const batalhaExistente = await Batalha.findOne({
      $or: [
        { jogador1: req.usuario._id, jogador2: adversarioId, status: { $in: ['aguardando', 'em_andamento'] } },
        { jogador1: adversarioId, jogador2: req.usuario._id, status: { $in: ['aguardando', 'em_andamento'] } }
      ]
    });
    if (batalhaExistente) {
      return res.status(400).json({ erro: 'Batalha já existe', mensagem: '⚔️ Já existe uma batalha em andamento com este caçador' });
    }
    const dataFim = new Date();
    dataFim.setMinutes(dataFim.getMinutes() + (duracao || 60));
    const novaBatalha = new Batalha({
      jogador1: req.usuario._id,
      jogador2: adversarioId,
      tipoBatalha: tipoBatalha || 'sequencia',
      duracao: duracao || 60,
      dataFim,
      criterios: criterios || [],
      configuracao: configuracao || {}
    });
    await novaBatalha.save();
    novaBatalha.adicionarAcao('batalha_criada', req.usuario._id, { tipoBatalha: novaBatalha.tipoBatalha, duracao: novaBatalha.duracao });
    const notificacao = new Mensagem({ remetente: req.usuario._id, destinatario: adversarioId, texto: `${req.usuario.nomeUsuario} te desafiou para uma batalha de ${tipoBatalha || 'sequência'}!`, tipo: 'desafio' });
    await notificacao.save();
    res.status(201).json({ sucesso: true, mensagem: '⚔️ Batalha criada com sucesso!', batalha: novaBatalha, notificacaoEnviada: true });
  } catch (erro) {
    console.error('Erro ao criar batalha:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível criar a batalha...' });
  }
};

exports.aceitarBatalha = async (req, res) => {
  try {
    const batalha = await Batalha.findById(req.params.id);
    if (!batalha){ return res.status(404).json({ erro: 'Batalha não encontrada', mensagem: '🌑 Esta batalha não existe' })};
    if (batalha.jogador2.toString() !== req.usuario._id.toString()) {return res.status(403).json({ erro: 'Acesso negado', mensagem: '⚔️ Você não pode aceitar esta batalha' })};
    if (batalha.status !== 'aguardando') {return res.status(400).json({ erro: 'Batalha inválida', mensagem: '⚔️ Esta batalha não está mais aguardando aceitação' })};
    batalha.status = 'em_andamento';
    batalha.adicionarAcao('batalha_aceita', req.usuario._id);
    await batalha.save();
    const notificacao = new Mensagem({ remetente: req.usuario._id, destinatario: batalha.jogador1, texto: `${req.usuario.nomeUsuario} aceitou sua batalha! A caçada começou!`, tipo: 'desafio' });
    await notificacao.save();
    res.json({ sucesso: true, mensagem: '⚔️ Batalha aceita! A caçada começou!', batalha });
  } catch (erro) {
    console.error('Erro ao aceitar batalha:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível aceitar a batalha...' });
  }
};

exports.finalizarBatalha = async (req, res) => {
  try {
    const batalha = await Batalha.findById(req.params.id).populate('jogador1', 'nomeUsuario').populate('jogador2', 'nomeUsuario');
    if (!batalha) {return res.status(404).json({ erro: 'Batalha não encontrada', mensagem: '🌑 Esta batalha não existe' })};
    if (batalha.status !== 'em_andamento') {return res.status(400).json({ erro: 'Batalha inválida', mensagem: '⚔️ Esta batalha não está em andamento' })};
    const pontuacaoJogador1 = await batalha.calcularPontuacao(batalha.jogador1._id);
    const pontuacaoJogador2 = await batalha.calcularPontuacao(batalha.jogador2._id);
    batalha.pontuacoes.jogador1 = pontuacaoJogador1;
    batalha.pontuacoes.jogador2 = pontuacaoJogador2;
    const resultado = batalha.determinarVencedor();
    batalha.status = 'concluida';
    batalha.adicionarAcao('batalha_finalizada', req.usuario._id, resultado);
    await batalha.save();
    if (resultado.vencedor) {
      const vencedor = await Usuario.findById(resultado.vencedor);
      const perdedor = await Usuario.findById(resultado.vencedor.equals(batalha.jogador1) ? batalha.jogador2 : batalha.jogador1);
      await vencedor.adicionarExperiencia(batalha.recompensas.vencedor.xp);
      await perdedor.adicionarExperiencia(batalha.recompensas.perdedor.xp);
      const notificacaoVencedor = new Mensagem({ remetente: req.usuario._id, destinatario: resultado.vencedor, texto: `🎉 Parabéns! Você venceu a batalha contra ${perdedor.nomeUsuario}! +${batalha.recompensas.vencedor.xp} XP`, tipo: 'sistema' });
      const notificacaoPerdedor = new Mensagem({ remetente: req.usuario._id, destinatario: perdedor._id, texto: `💪 Boa tentativa! Você perdeu para ${vencedor.nomeUsuario}, mas ganhou ${batalha.recompensas.perdedor.xp} XP de consolação!`, tipo: 'sistema' });
      await notificacaoVencedor.save();
      await notificacaoPerdedor.save();
    }
    res.json({ sucesso: true, mensagem: '⚔️ Batalha finalizada!', batalha, resultado });
  } catch (erro) {
    console.error('Erro ao finalizar batalha:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível finalizar a batalha...' });
  }
};

exports.listarBatalhas = async (req, res) => {
  try {
    const { status, tipo } = req.query;
    const filtros = { $or: [{ jogador1: req.usuario._id }, { jogador2: req.usuario._id }] };
    if (status) { filtros.status = status; }
    if (tipo) { filtros.tipoBatalha = tipo; }
    const batalhas = await Batalha.find(filtros).populate('jogador1', 'nomeUsuario avatar nivel').populate('jogador2', 'nomeUsuario avatar nivel').sort({ createdAt: -1 });
    res.json({ sucesso: true, mensagem: `⚔️ ${batalhas.length} batalhas encontradas`, batalhas });
  } catch (erro) {
    console.error('Erro ao listar batalhas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as batalhas...' });
  }
};

exports.criarDesafio = async (req, res) => {
  try {
    const { adversarioId, tipoDesafio, dataFim, mensagem } = req.body;
    const adversario = await Usuario.findById(adversarioId);
    if (!adversario) {return res.status(404).json({ erro: 'Adversário não encontrado', mensagem: '🌑 Este caçador não existe no Librarium' })};
    if (adversarioId === req.usuario._id.toString()) {return res.status(400).json({ erro: 'Desafio inválido', mensagem: '⚔️ Você não pode desafiar a si mesmo' })};
    const desafioExistente = await Desafio.findOne({ $or: [ { remetente: req.usuario._id, destinatario: adversarioId, status: 'pendente' }, { remetente: adversarioId, destinatario: req.usuario._id, status: 'pendente' } ] });
    if (desafioExistente) {return res.status(400).json({ erro: 'Desafio já existe', mensagem: '⚔️ Já existe um desafio pendente com este caçador' })};
    const novoDesafio = new Desafio({ remetente: req.usuario._id, destinatario: adversarioId, tipoDesafio: tipoDesafio || 'sequencia_7_dias', dataFim: dataFim || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), mensagem });
    await novoDesafio.save();
    const notificacao = new Mensagem({ remetente: req.usuario._id, destinatario: adversarioId, texto: `${req.usuario.nomeUsuario} te desafiou para: ${tipoDesafio || 'sequencia_7_dias'}!`, tipo: 'desafio' });
    await notificacao.save();
    res.status(201).json({ sucesso: true, mensagem: '⚔️ Desafio enviado com sucesso!', desafio: novoDesafio });
  } catch (erro) {
    console.error('Erro ao criar desafio:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível enviar o desafio...' });
  }
};

exports.responderDesafio = async (req, res) => {
  try {
    const { resposta } = req.body;
    const desafio = await Desafio.findById(req.params.id);
    if (!desafio) {
      return res.status(404).json(
        { 
          erro: 'Desafio não encontrado', 
          mensagem: '🌑 Este desafio não existe' 
        }
      )
    };
    if (desafio.destinatario.toString() !== req.usuario._id.toString()) 
      {return res.status(403).json(
        { 
          erro: 'Acesso negado',
          mensagem: '⚔️ Você não pode responder a este desafio'
         }
      )
    };
    if (desafio.status !== 'pendente') 
      {return res.status(400).json(
        { 
          erro: 'Desafio inválido', 
          mensagem: '⚔️ Este desafio não está mais pendente' 
        }
      )
    };
    desafio.status = resposta;
    desafio.dataResposta = new Date();
    await desafio.save();
    const notificacao = new Mensagem({ remetente: req.usuario._id, destinatario: desafio.remetente, texto: `${req.usuario.nomeUsuario} ${resposta === 'aceito' ? 'aceitou' : 'recusou'} seu desafio!`, tipo: 'desafio' });
    await notificacao.save();
    res.json({ sucesso: true, mensagem: `Desafio ${resposta === 'aceito' ? 'aceito' : 'recusado'} com sucesso!`, desafio });
  } catch (erro) {
    console.error('Erro ao responder desafio:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível responder ao desafio...' });
  }
};

exports.listarDesafios = async (req, res) => {
  try {
    const { status, tipo } = req.query;
    const filtros = { $or: [{ remetente: req.usuario._id }, { destinatario: req.usuario._id }] };
    if (status) {
      filtros.status = status; 
    }
    if (tipo) {
      filtros.tipoDesafio = tipo; 
    }
    const desafios = await Desafio.find(filtros).populate('remetente', 'nomeUsuario avatar nivel').populate('destinatario', 'nomeUsuario avatar nivel').sort({ createdAt: -1 });
    res.json({ sucesso: true, mensagem: `⚔️ ${desafios.length} desafios encontrados`, desafios });
  } catch (erro) {
    console.error('Erro ao listar desafios:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar os desafios...' });
  }
};

exports.enviarMensagem = async (req, res) => {
  try {
    const { destinatarioId, texto, tipo, anexos, respostaPara } = req.body;
    const destinatario = await Usuario.findById(destinatarioId);
    if (!destinatario) {
      return res.status(404).json({ erro: 'Destinatário não encontrado', mensagem: '🌑 Este caçador não existe no Librarium' })
    };
    if (destinatarioId === req.usuario._id.toString()) {
      return res.status(400).json({ erro: 'Destinatário inválido', mensagem: '⚔️ Você não pode enviar mensagem para si mesmo' })
    };
    if (respostaPara) {
      const mensagemOriginal = await Mensagem.findById(respostaPara);
      if (!mensagemOriginal) {return res.status(404).json({ erro: 'Mensagem original não encontrada', mensagem: '🌑 A mensagem que você está respondendo não existe' })};
      if (!mensagemOriginal.podeSerRespondida()) {return res.status(400).json({ erro: 'Mensagem muito antiga', mensagem: '⚔️ Esta mensagem é muito antiga para ser respondida' })};
    }
    const novaMensagem = new Mensagem({ remetente: req.usuario._id, destinatario: destinatarioId, texto, tipo: tipo || 'privada', anexos: anexos || [], respostaPara });
    await novaMensagem.save();
    if (respostaPara) {
      const mensagemOriginal = await Mensagem.findById(respostaPara);
      mensagemOriginal.thread.push({ mensagem: novaMensagem._id, ordem: mensagemOriginal.thread.length + 1 });
      await mensagemOriginal.save();
    }
    res.status(201).json({ sucesso: true, mensagem: '📨 Mensagem enviada com sucesso!', mensagem: novaMensagem });
  } catch (erro) {
    console.error('Erro ao enviar mensagem:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível enviar a mensagem...' });
  }
};

exports.obterConversa = async (req, res) => {
  try {
    const { limite = 50 } = req.query;
    const conversa = await Mensagem.obterConversa(req.usuario._id, req.params.usuarioId, parseInt(limite));
    res.json({ sucesso: true, mensagem: `📨 ${conversa.length} mensagens na conversa`, conversa: conversa.reverse() });
  } catch (erro) {
    console.error('Erro ao obter conversa:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar a conversa...' });
  }
};

exports.lerMensagem = async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id);
    if (!mensagem) {
      return res.status(404).json({ erro: 'Mensagem não encontrada', mensagem: '🌑 Esta mensagem não existe' })
    };
    if (mensagem.destinatario.toString() !== req.usuario._id.toString()){
      return res.status(403).json({ erro: 'Acesso negado', mensagem: '⚔️ Você não pode marcar esta mensagem como lida' })
    };
    await mensagem.marcarComoLida();
    res.json({ sucesso: true, mensagem: '📨 Mensagem marcada como lida', mensagem: mensagem });
  } catch (erro) {
    console.error('Erro ao marcar mensagem como lida:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível marcar a mensagem como lida...' });
  }
};

exports.mensagensNaoLidas = async (req, res) => {
  try {
    const mensagens = await Mensagem.obterNaoLidas(req.usuario._id);
    res.json({ sucesso: true, mensagem: `📨 ${mensagens.length} mensagens não lidas`, mensagens });
  } catch (erro) {
    console.error('Erro ao obter mensagens não lidas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as mensagens não lidas...' });
  }
};

exports.estatisticas = async (req, res) => {
  try {
    const [batalhas, desafios, mensagens] = await Promise.all([
      Batalha.countDocuments({ $or: [{ jogador1: req.usuario._id }, { jogador2: req.usuario._id }] }),
      Desafio.countDocuments({ $or: [{ remetente: req.usuario._id }, { destinatario: req.usuario._id }] }),
      Mensagem.obterEstatisticas(req.usuario._id)
    ]);
    const batalhasVencidas = await Batalha.countDocuments({ $or: [{ jogador1: req.usuario._id }, { jogador2: req.usuario._id }], status: 'concluida', 'resultado.vencedor': req.usuario._id });
    const batalhasPerdidas = await Batalha.countDocuments({ $or: [{ jogador1: req.usuario._id }, { jogador2: req.usuario._id }], status: 'concluida', 'resultado.vencedor': { $ne: req.usuario._id }, 'resultado.empate': false });
    const batalhasEmpatadas = await Batalha.countDocuments({ $or: [{ jogador1: req.usuario._id }, { jogador2: req.usuario._id }], status: 'concluida', 'resultado.empate': true });
    res.json({ sucesso: true, estatisticas: { batalhas: { total: batalhas, vencidas: batalhasVencidas, perdidas: batalhasPerdidas, empatadas: batalhasEmpatadas, taxaVitoria: batalhas > 0 ? Math.round((batalhasVencidas / batalhas) * 100) : 0 }, desafios: { total: desafios, enviados: await Desafio.countDocuments({ remetente: req.usuario._id }), recebidos: await Desafio.countDocuments({ destinatario: req.usuario._id }) }, mensagens, ranking: { posicao: await Usuario.countDocuments({ experiencia: { $gt: req.usuario.experiencia } }) + 1, totalJogadores: await Usuario.countDocuments() } } });
  } catch (erro) {
    console.error('Erro ao obter estatísticas multiplayer:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as estatísticas...' });
  }
};

exports.ranking = async (req, res) => {
  try {
    const { limite = 20, periodo = '30' } = req.query;
    const diasAtras = parseInt(periodo);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasAtras);

    const usuariosAtivos = await Usuario.find({
      ultimaAtividade: { $gte: dataInicio }
    })
      .select('nomeUsuario nivel experiencia titulo avatar ultimaAtividade')
      .sort({ experiencia: -1, nivel: -1 })
      .limit(parseInt(limite));

    const posicaoUsuario = await Usuario.countDocuments({
      experiencia: { $gt: req.usuario.experiencia },
      ultimaAtividade: { $gte: dataInicio }
    }) + 1;

    res.json({
      sucesso: true,
      mensagem: `🏆 Top ${limite} caçadores ativos (${periodo} dias)`,
      ranking: usuariosAtivos.map((usuario, index) => ({
        posicao: index + 1,
        nomeUsuario: usuario.nomeUsuario,
        nivel: usuario.nivel,
        experiencia: usuario.experiencia,
        titulo: usuario.titulo,
        avatar: usuario.avatar,
        ultimaAtividade: usuario.ultimaAtividade
      })),
      usuarioAtual: {
        posicao: posicaoUsuario,
        nomeUsuario: req.usuario.nomeUsuario,
        nivel: req.usuario.nivel,
        experiencia: req.usuario.experiencia
      }
    });
  } catch (erro) {
    console.error('Erro ao obter ranking:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar o ranking...' });
  }
};


