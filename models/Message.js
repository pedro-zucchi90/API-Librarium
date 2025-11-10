const mongoose = require('mongoose');

const esquemaMensagem = new mongoose.Schema({
  remetente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Remetente é obrigatório']
  },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Destinatário é obrigatório']
  },
  texto: {
    type: String,
    required: [true, 'Texto da mensagem é obrigatório'],
    maxlength: [500, 'Mensagem deve ter no máximo 500 caracteres']
  },
  tipo: {
    type: String,
    enum: ['privada', 'desafio', 'sistema', 'conquista'],
    default: 'privada'
  },
  lida: {
    type: Boolean,
    default: false
  },
  dataLeitura: {
    type: Date
  },
  anexos: [{
    tipo: { type: String, enum: ['imagem', 'link', 'arquivo'] },
    url: String,
    nome: String,
    tamanho: Number
  }],
  reacao: {
    tipo: { type: String, enum: ['like', 'love', 'wow', 'sad', 'angry'] },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  },
  respostaPara: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mensagem'
  },
  thread: [{
    mensagem: { type: mongoose.Schema.Types.ObjectId, ref: 'Mensagem' },
    ordem: Number
  }]
}, {
  timestamps: true
});

// Índices para consultas eficientes
esquemaMensagem.index({ remetente: 1, destinatario: 1 });
esquemaMensagem.index({ destinatario: 1, lida: 1 });
esquemaMensagem.index({ destinatario: 1, createdAt: -1 });
esquemaMensagem.index({ tipo: 1, createdAt: -1 });

// Método para marcar mensagem como lida
esquemaMensagem.methods.marcarComoLida = function () {
  this.lida = true;
  this.dataLeitura = new Date();
  return this.save();
};

// Método para verificar se a mensagem pode ser respondida
esquemaMensagem.methods.podeSerRespondida = function () {
  const agora = new Date();
  const limiteResposta = new Date(this.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias
  return agora <= limiteResposta;
};

// Método para obter conversa entre dois usuários
esquemaMensagem.statics.obterConversa = async function (usuario1Id, usuario2Id, limite = 50) {
  return this.find({
    $or: [
      { remetente: usuario1Id, destinatario: usuario2Id },
      { remetente: usuario2Id, destinatario: usuario1Id }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limite)
    .populate('remetente', 'nomeUsuario avatar')
    .populate('destinatario', 'nomeUsuario avatar')
    .populate('respostaPara', 'texto remetente');
};

// Método para obter mensagens não lidas de um usuário
esquemaMensagem.statics.obterNaoLidas = async function (usuarioId) {
  return this.find({
    destinatario: usuarioId,
    lida: false
  })
    .sort({ createdAt: -1 })
    .populate('remetente', 'nomeUsuario avatar')
    .populate('destinatario', 'nomeUsuario avatar');
};

// Método para obter estatísticas de mensagens
esquemaMensagem.statics.obterEstatisticas = async function (usuarioId) {
  const totalEnviadas = await this.countDocuments({ remetente: usuarioId });
  const totalRecebidas = await this.countDocuments({ destinatario: usuarioId });
  const naoLidas = await this.countDocuments({ destinatario: usuarioId, lida: false });

  return {
    totalEnviadas,
    totalRecebidas,
    naoLidas,
    total: totalEnviadas + totalRecebidas
  };
};

// Método para listar todas as conversas de um usuário
esquemaMensagem.statics.listarConversas = async function (usuarioId) {
  // Buscar todas as mensagens onde o usuário é remetente ou destinatário
  const mensagens = await this.find({
    $or: [
      { remetente: usuarioId },
      { destinatario: usuarioId }
    ]
  })
    .sort({ createdAt: -1 })
    .populate('remetente', 'nomeUsuario avatar fotoPerfil')
    .populate('destinatario', 'nomeUsuario avatar fotoPerfil')
    .lean();

  // Agrupar por conversa (outro usuário)
  const conversasMap = new Map();

  mensagens.forEach(mensagem => {
    const remetenteId = mensagem.remetente._id.toString();
    const destinatarioId = mensagem.destinatario._id.toString();
    const usuarioIdStr = usuarioId.toString();
    
    const outroUsuarioId = remetenteId === usuarioIdStr
      ? destinatarioId
      : remetenteId;
    
    const outroUsuario = remetenteId === usuarioIdStr
      ? mensagem.destinatario
      : mensagem.remetente;

    if (!conversasMap.has(outroUsuarioId)) {
      conversasMap.set(outroUsuarioId, {
        usuarioId: outroUsuarioId,
        usuario: outroUsuario,
        ultimaMensagem: mensagem,
        naoLidas: 0,
        totalMensagens: 0
      });
    }

    const conversa = conversasMap.get(outroUsuarioId);
    conversa.totalMensagens++;
    
    // Contar não lidas apenas se o usuário atual é o destinatário
    if (destinatarioId === usuarioIdStr && !mensagem.lida) {
      conversa.naoLidas++;
    }

    // Atualizar última mensagem se for mais recente
    const ultimaData = new Date(conversa.ultimaMensagem.createdAt);
    const mensagemData = new Date(mensagem.createdAt);
    if (mensagemData > ultimaData) {
      conversa.ultimaMensagem = mensagem;
    }
  });

  // Converter map para array e ordenar por última mensagem
  const conversas = Array.from(conversasMap.values()).sort((a, b) => {
    return new Date(b.ultimaMensagem.createdAt) - new Date(a.ultimaMensagem.createdAt);
  });

  return conversas;
};

module.exports = mongoose.model('Mensagem', esquemaMensagem);
