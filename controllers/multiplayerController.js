const Usuario = require('../models/User');
const Habito = require('../models/Habit');
const Desafio = require('../models/Challenge');
const Mensagem = require('../models/Message');
const Batalha = require('../models/Battle');
const Amizade = require('../models/Friendship');

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
    
    if (!batalha) {
      return res.status(404).json({
        erro: 'Batalha não encontrada',
        mensagem: '🌑 Esta batalha não existe'
      });
    }

    const jogador2Id = batalha.jogador2.toString();
    const usuarioAtualId = req.usuario._id.toString();
    const jogador1Id = batalha.jogador1.toString();

    // Verificar se o usuário atual é o destinatário (jogador2) e NÃO o criador (jogador1)
    if (jogador2Id !== usuarioAtualId) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: '⚔️ Você não pode aceitar esta batalha. Apenas o destinatário pode aceitar.'
      });
    }

    // Verificar se o usuário não é o criador da batalha
    if (jogador1Id === usuarioAtualId) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: '⚔️ Você não pode aceitar uma batalha que você mesmo criou.'
      });
    }

    if (batalha.status !== 'aguardando') {
      return res.status(400).json({
        erro: 'Batalha inválida',
        mensagem: '⚔️ Esta batalha não está mais aguardando aceitação'
      });
    }

    batalha.status = 'em_andamento';
    batalha.adicionarAcao('batalha_aceita', req.usuario._id);
    await batalha.save();
    
    const notificacao = new Mensagem({
      remetente: req.usuario._id,
      destinatario: batalha.jogador1,
      texto: `${req.usuario.nomeUsuario} aceitou sua batalha! A caçada começou!`,
      tipo: 'desafio'
    });
    await notificacao.save();
    
    res.json({
      sucesso: true,
      mensagem: '⚔️ Batalha aceita! A caçada começou!',
      batalha
    });
  } catch (erro) {
    console.error('Erro ao aceitar batalha:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível aceitar a batalha...'
    });
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
    const batalhas = await Batalha.find(filtros).populate('jogador1', 'nomeUsuario avatar nivel fotoPerfil').populate('jogador2', 'nomeUsuario avatar nivel fotoPerfil').sort({ createdAt: -1 });
    res.json({ sucesso: true, mensagem: `⚔️ ${batalhas.length} batalhas encontradas`, batalhas });
  } catch (erro) {
    console.error('Erro ao listar batalhas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as batalhas...' });
  }
};

// Listar apenas batalhas pendentes que o usuário RECEBEU (não as que ele criou)
exports.listarBatalhasPendentes = async (req, res) => {
  try {
    // Apenas batalhas onde o usuário é jogador2 (destinatário) e status é 'aguardando'
    const batalhas = await Batalha.find({
      jogador2: req.usuario._id,
      status: 'aguardando'
    })
      .populate('jogador1', 'nomeUsuario avatar nivel fotoPerfil')
      .populate('jogador2', 'nomeUsuario avatar nivel fotoPerfil')
      .sort({ createdAt: -1 });
    
    res.json({
      sucesso: true,
      mensagem: `⚔️ ${batalhas.length} batalha(s) pendente(s)`,
      batalhas
    });
  } catch (erro) {
    console.error('Erro ao listar batalhas pendentes:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar as batalhas pendentes...'
    });
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
    const desafios = await Desafio.find(filtros).populate('remetente', 'nomeUsuario avatar nivel fotoPerfil').populate('destinatario', 'nomeUsuario avatar nivel fotoPerfil').sort({ createdAt: -1 });
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
    // Validar tipo de mensagem - apenas valores permitidos no enum
    const tiposPermitidos = ['privada', 'desafio', 'sistema', 'conquista'];
    const tipoMensagem = tipo && tiposPermitidos.includes(tipo) ? tipo : 'privada';
    
    const novaMensagem = new Mensagem({ 
      remetente: req.usuario._id, 
      destinatario: destinatarioId, 
      texto, 
      tipo: tipoMensagem, 
      anexos: anexos || [], 
      respostaPara 
    });
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
    // Marcar mensagens como lidas ao abrir conversa
    await Mensagem.updateMany(
      {
        remetente: req.params.usuarioId,
        destinatario: req.usuario._id,
        lida: false
      },
      {
        $set: { lida: true, dataLeitura: new Date() }
      }
    );
    res.json({ sucesso: true, mensagem: `📨 ${conversa.length} mensagens na conversa`, conversa: conversa.reverse() });
  } catch (erro) {
    console.error('Erro ao obter conversa:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar a conversa...' });
  }
};

exports.listarConversas = async (req, res) => {
  try {
    const conversas = await Mensagem.listarConversas(req.usuario._id);
    res.json({
      sucesso: true,
      mensagem: `📨 ${conversas.length} conversa(s) encontrada(s)`,
      conversas: conversas
    });
  } catch (erro) {
    console.error('Erro ao listar conversas:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível listar as conversas...'
    });
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
      .select('nomeUsuario nivel experiencia titulo avatar fotoPerfil ultimaAtividade')
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
        fotoPerfil: usuario.fotoPerfil,
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

// ===== SISTEMA DE AMIZADES =====

exports.enviarSolicitacaoAmizade = async (req, res) => {
  try {
    const { usuarioId } = req.body;
    
    if (usuarioId === req.usuario._id.toString()) {
      return res.status(400).json({
        erro: 'Ação inválida',
        mensagem: '⚔️ Você não pode enviar solicitação de amizade para si mesmo'
      });
    }

    const destinatario = await Usuario.findById(usuarioId);
    if (!destinatario) {
      return res.status(404).json({
        erro: 'Usuário não encontrado',
        mensagem: '🌑 Este caçador não existe no Librarium'
      });
    }

    // Verificar se já existe amizade ou solicitação
    const amizadeExistente = await Amizade.findOne({
      $or: [
        { usuario1: req.usuario._id, usuario2: usuarioId },
        { usuario1: usuarioId, usuario2: req.usuario._id }
      ]
    });

    if (amizadeExistente) {
      if (amizadeExistente.status === 'aceita') {
        return res.status(400).json({
          erro: 'Já são amigos',
          mensagem: '⚔️ Vocês já são amigos!'
        });
      }
      if (amizadeExistente.status === 'pendente') {
        return res.status(400).json({
          erro: 'Solicitação já existe',
          mensagem: '⚔️ Já existe uma solicitação de amizade pendente'
        });
      }
    }

    // Criar nova solicitação
    const novaAmizade = new Amizade({
      usuario1: req.usuario._id,
      usuario2: usuarioId,
      status: 'pendente',
      solicitadoPor: req.usuario._id
    });
    await novaAmizade.save();

    // Enviar notificação
    const notificacao = new Mensagem({
      remetente: req.usuario._id,
      destinatario: usuarioId,
      texto: `${req.usuario.nomeUsuario} quer ser seu amigo!`,
      tipo: 'sistema'
    });
    await notificacao.save();

    res.status(201).json({
      sucesso: true,
      mensagem: '🤝 Solicitação de amizade enviada!',
      amizade: novaAmizade
    });
  } catch (erro) {
    console.error('Erro ao enviar solicitação de amizade:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível enviar a solicitação...'
    });
  }
};

exports.aceitarSolicitacaoAmizade = async (req, res) => {
  try {
    const { amizadeId } = req.body;
    
    if (!amizadeId) {
      return res.status(400).json({
        erro: 'ID da amizade não fornecido',
        mensagem: '🌑 Por favor, forneça o ID da solicitação'
      });
    }

    const amizade = await Amizade.findById(amizadeId);

    if (!amizade) {
      return res.status(404).json({
        erro: 'Solicitação não encontrada',
        mensagem: '🌑 Esta solicitação não existe'
      });
    }

    // Verificar se o usuário atual é o destinatário (usuario2) da solicitação
    // usuario2 é quem recebe a solicitação e pode aceitar
    const usuario2Id = amizade.usuario2.toString();
    const usuarioAtualId = req.usuario._id.toString();
    const usuario1Id = amizade.usuario1.toString();
    const solicitadoPorId = amizade.solicitadoPor.toString();
    
    console.log('Verificando permissão para aceitar:', {
      amizadeId: amizade._id.toString(),
      usuario2Id,
      usuarioAtualId,
      usuario1Id,
      solicitadoPorId,
      status: amizade.status
    });

    // Verificar se o usuário atual é o destinatário (usuario2)
    if (usuario2Id !== usuarioAtualId) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: '⚔️ Você não pode aceitar esta solicitação. Apenas o destinatário pode aceitar.'
      });
    }

    // Verificar se o usuário não é quem enviou a solicitação (solicitadoPor)
    if (solicitadoPorId === usuarioAtualId) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: '⚔️ Você não pode aceitar uma solicitação que você mesmo enviou.'
      });
    }

    // Verificar se o usuário não é o usuario1 (quem enviou)
    if (usuario1Id === usuarioAtualId) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: '⚔️ Você não pode aceitar uma solicitação que você mesmo enviou.'
      });
    }

    if (amizade.status !== 'pendente') {
      return res.status(400).json({
        erro: 'Solicitação inválida',
        mensagem: '⚔️ Esta solicitação não está mais pendente'
      });
    }

    amizade.status = 'aceita';
    amizade.dataAceitacao = new Date();
    await amizade.save();

    // Enviar notificação
    const notificacao = new Mensagem({
      remetente: req.usuario._id,
      destinatario: amizade.usuario1,
      texto: `${req.usuario.nomeUsuario} aceitou sua solicitação de amizade!`,
      tipo: 'sistema'
    });
    await notificacao.save();

    res.json({
      sucesso: true,
      mensagem: '🤝 Amizade aceita!',
      amizade
    });
  } catch (erro) {
    console.error('Erro ao aceitar solicitação de amizade:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível aceitar a solicitação...'
    });
  }
};

exports.rejeitarSolicitacaoAmizade = async (req, res) => {
  try {
    const { amizadeId } = req.body;
    
    if (!amizadeId) {
      return res.status(400).json({
        erro: 'ID da amizade não fornecido',
        mensagem: '🌑 Por favor, forneça o ID da solicitação'
      });
    }

    const amizade = await Amizade.findById(amizadeId);

    if (!amizade) {
      return res.status(404).json({
        erro: 'Solicitação não encontrada',
        mensagem: '🌑 Esta solicitação não existe'
      });
    }

    // Verificar se o usuário atual é o destinatário (usuario2) da solicitação
    const usuario2Id = amizade.usuario2.toString();
    const usuarioAtualId = req.usuario._id.toString();
    
    if (usuario2Id !== usuarioAtualId) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: '⚔️ Você não pode recusar esta solicitação. Apenas o destinatário pode recusar.'
      });
    }

    amizade.status = 'rejeitada';
    await amizade.save();

    res.json({
      sucesso: true,
      mensagem: 'Solicitação de amizade rejeitada',
      amizade
    });
  } catch (erro) {
    console.error('Erro ao rejeitar solicitação de amizade:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível rejeitar a solicitação...'
    });
  }
};

exports.listarAmigos = async (req, res) => {
  try {
    const amigos = await Amizade.obterAmigos(req.usuario._id);
    
    res.json({
      sucesso: true,
      mensagem: `🤝 ${amigos.length} amigo(s) encontrado(s)`,
      amigos
    });
  } catch (erro) {
    console.error('Erro ao listar amigos:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar os amigos...'
    });
  }
};

exports.listarSolicitacoesPendentes = async (req, res) => {
  try {
    const solicitacoes = await Amizade.obterSolicitacoesPendentes(req.usuario._id);
    
    res.json({
      sucesso: true,
      mensagem: `${solicitacoes.length} solicitação(ões) pendente(s)`,
      solicitacoes
    });
  } catch (erro) {
    console.error('Erro ao listar solicitações pendentes:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar as solicitações...'
    });
  }
};

exports.listarSolicitacoesEnviadas = async (req, res) => {
  try {
    const solicitacoes = await Amizade.obterSolicitacoesEnviadas(req.usuario._id);
    
    res.json({
      sucesso: true,
      mensagem: `${solicitacoes.length} solicitação(ões) enviada(s)`,
      solicitacoes
    });
  } catch (erro) {
    console.error('Erro ao listar solicitações enviadas:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar as solicitações...'
    });
  }
};

exports.removerAmizade = async (req, res) => {
  try {
    const { amizadeId } = req.body;
    
    const amizade = await Amizade.findById(amizadeId);

    if (!amizade) {
      return res.status(404).json({
        erro: 'Amizade não encontrada',
        mensagem: '🌑 Esta amizade não existe'
      });
    }

    if (amizade.usuario1.toString() !== req.usuario._id.toString() &&
        amizade.usuario2.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: '⚔️ Você não pode remover esta amizade'
      });
    }

    await amizade.deleteOne();

    res.json({
      sucesso: true,
      mensagem: 'Amizade removida com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao remover amizade:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível remover a amizade...'
    });
  }
};

exports.buscarUsuarios = async (req, res) => {
  try {
    const { query, limite = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        erro: 'Query inválida',
        mensagem: 'Por favor, forneça pelo menos 2 caracteres para buscar'
      });
    }

    // Escapar caracteres especiais da query para regex seguro
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Buscar por nome de usuário (busca parcial, case-insensitive)
    // Também busca por palavras parciais (ex: "jo" encontra "João", "Joana", etc)
    const usuarios = await Usuario.find({
      $or: [
        { nomeUsuario: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } }
      ],
      _id: { $ne: req.usuario._id }
    })
      .select('nomeUsuario avatar nivel experiencia titulo fotoPerfil ultimaAtividade')
      .limit(parseInt(limite))
      .sort({ nivel: -1, experiencia: -1 });

    // Verificar status de amizade para cada usuário
    const usuariosComStatus = await Promise.all(usuarios.map(async (usuario) => {
      const saoAmigos = await Amizade.saoAmigos(req.usuario._id, usuario._id);
      const solicitacaoPendente = await Amizade.findOne({
        $or: [
          { usuario1: req.usuario._id, usuario2: usuario._id, status: 'pendente' },
          { usuario1: usuario._id, usuario2: req.usuario._id, status: 'pendente' }
        ]
      });

      return {
        ...usuario.toObject(),
        saoAmigos,
        solicitacaoPendente: solicitacaoPendente !== null,
        solicitacaoId: solicitacaoPendente?._id
      };
    }));

    res.json({
      sucesso: true,
      mensagem: `${usuariosComStatus.length} usuário(s) encontrado(s)`,
      usuarios: usuariosComStatus
    });
  } catch (erro) {
    console.error('Erro ao buscar usuários:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível buscar usuários...'
    });
  }
};


