const mongoose = require('mongoose');

const esquemaProgresso = new mongoose.Schema({
  idHabito: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habito',
    required: [true, 'ID do hábito é obrigatório']
  },
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'ID do usuário é obrigatório']
  },
  data: {
    type: Date,
    required: [true, 'Data é obrigatória'],
    default: Date.now
  },
  status: {
    type: String,
    required: [true, 'Status é obrigatório'],
    enum: ['concluido', 'perdido', 'parcial'],
    default: 'concluido'
  },
  observacoes: {
    type: String,
    maxlength: [200, 'Observações devem ter no máximo 200 caracteres']
  },
  experienciaGanha: {
    type: Number,
    default: 0
  },
  concluidoEm: {
    type: Date,
    default: Date.now
  },
  dificuldade: {
    type: String,
    enum: ['facil', 'medio', 'dificil', 'lendario']
  }
}, {
  timestamps: true
});

// Índice composto para garantir uma entrada de progresso por hábito por dia
esquemaProgresso.index({ idHabito: 1, data: 1 }, { unique: true });

// Índices para consultas eficientes
esquemaProgresso.index({ idUsuario: 1, data: -1 });
esquemaProgresso.index({ idHabito: 1, status: 1 });

module.exports = mongoose.model('Progresso', esquemaProgresso);
