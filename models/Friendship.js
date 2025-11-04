const mongoose = require('mongoose');

const esquemaAmizade = new mongoose.Schema({
  usuario1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Usuário 1 é obrigatório']
  },
  usuario2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Usuário 2 é obrigatório']
  },
  status: {
    type: String,
    enum: ['pendente', 'aceita', 'rejeitada', 'bloqueada'],
    default: 'pendente',
    required: true
  },
  solicitadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Solicitante é obrigatório']
  },
  dataAceitacao: {
    type: Date
  },
  dataBloqueio: {
    type: Date
  },
  motivoBloqueio: {
    type: String,
    maxlength: [200, 'Motivo do bloqueio deve ter no máximo 200 caracteres']
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
esquemaAmizade.index({ usuario1: 1, usuario2: 1 }, { unique: true });
esquemaAmizade.index({ usuario1: 1, status: 1 });
esquemaAmizade.index({ usuario2: 1, status: 1 });
esquemaAmizade.index({ solicitadoPor: 1, status: 1 });

// Método estático para verificar se dois usuários são amigos
esquemaAmizade.statics.saoAmigos = async function (usuario1Id, usuario2Id) {
  const amizade = await this.findOne({
    $or: [
      { usuario1: usuario1Id, usuario2: usuario2Id },
      { usuario1: usuario2Id, usuario2: usuario1Id }
    ],
    status: 'aceita'
  });
  return amizade !== null;
};

// Método estático para obter lista de amigos de um usuário
esquemaAmizade.statics.obterAmigos = async function (usuarioId) {
  const amizades = await this.find({
    $or: [
      { usuario1: usuarioId, status: 'aceita' },
      { usuario2: usuarioId, status: 'aceita' }
    ]
  })
    .populate('usuario1', 'nomeUsuario avatar nivel experiencia titulo fotoPerfil ultimaAtividade')
    .populate('usuario2', 'nomeUsuario avatar nivel experiencia titulo fotoPerfil ultimaAtividade');

  return amizades.map(amizade => {
    const amigo = amizade.usuario1._id.toString() === usuarioId.toString()
      ? amizade.usuario2
      : amizade.usuario1;
    return {
      ...amigo.toObject(),
      dataAmizade: amizade.dataAceitacao || amizade.createdAt,
      amizadeId: amizade._id
    };
  });
};

// Método estático para obter solicitações pendentes
esquemaAmizade.statics.obterSolicitacoesPendentes = async function (usuarioId) {
  return this.find({
    usuario2: usuarioId,
    status: 'pendente'
  })
    .populate('usuario1', 'nomeUsuario avatar nivel experiencia titulo fotoPerfil')
    .populate('solicitadoPor', 'nomeUsuario avatar')
    .sort({ createdAt: -1 });
};

// Método estático para obter solicitações enviadas
esquemaAmizade.statics.obterSolicitacoesEnviadas = async function (usuarioId) {
  return this.find({
    usuario1: usuarioId,
    status: 'pendente'
  })
    .populate('usuario2', 'nomeUsuario avatar nivel experiencia titulo fotoPerfil')
    .populate('solicitadoPor', 'nomeUsuario avatar')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Amizade', esquemaAmizade);

