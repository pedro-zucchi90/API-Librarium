const mongoose = require('mongoose');

const esquemaConquista = new mongoose.Schema({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'ID do usuário é obrigatório']
  },
  titulo: {
    type: String,
    required: [true, 'Título da conquista é obrigatório'],
    trim: true,
    maxlength: [100, 'Título deve ter no máximo 100 caracteres']
  },
  descricao: {
    type: String,
    required: [true, 'Descrição da conquista é obrigatória'],
    trim: true,
    maxlength: [300, 'Descrição deve ter no máximo 300 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo da conquista é obrigatório'],
    enum: ['primeira_semana', 'sequencia_7_dias', 'sequencia_30_dias', 'nivel_10', 'nivel_20', 'nivel_30', 'cacador_lendario', 'mestre_habitos', 'guardiao_tempo'],
    default: 'primeira_semana'
  },
  categoria: {
    type: String,
    enum: ['progresso', 'tempo', 'nivel', 'especial'],
    default: 'progresso'
  },
  icone: {
    type: String,
    default: 'medalha'
  },
  cor: {
    type: String,
    default: '#FFD700' // Dourado
  },
  experienciaRecompensa: {
    type: Number,
    default: 50
  },
  raridade: {
    type: String,
    enum: ['comum', 'raro', 'epico', 'lendario'],
    default: 'comum'
  },
  desbloqueadaEm: {
    type: Date,
    default: Date.now
  },
  condicoes: {
    tipo: { type: String }, // 'sequencia', 'nivel', 'habitos_concluidos', etc
    valor: { type: Number }, // valor necessário para desbloquear
    periodo: { type: String } // 'diario', 'semanal', 'mensal', 'total'
  },
  visivel: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
esquemaConquista.index({ idUsuario: 1, tipo: 1 });
esquemaConquista.index({ idUsuario: 1, desbloqueadaEm: -1 });
esquemaConquista.index({ raridade: 1, categoria: 1 });

// Método para verificar se a conquista deve ser desbloqueada
esquemaConquista.methods.verificarDesbloqueio = function (dadosUsuario) {
  const { tipo, valor } = this.condicoes;

  switch (tipo) {
  case 'sequencia':
    return dadosUsuario.maiorSequencia >= valor;
  case 'nivel':
    return dadosUsuario.nivel >= valor;
  case 'habitos_concluidos':
    return dadosUsuario.totalHabitosConcluidos >= valor;
  case 'dias_ativo':
    return dadosUsuario.diasAtivo >= valor;
  default:
    return false;
  }
};

module.exports = mongoose.model('Conquista', esquemaConquista);
