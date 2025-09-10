const mongoose = require('mongoose');

const esquemaHabito = new mongoose.Schema({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'ID do usuário é obrigatório']
  },
  titulo: {
    type: String,
    required: [true, 'Título do hábito é obrigatório'],
    trim: true,
    maxlength: [100, 'Título deve ter no máximo 100 caracteres']
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição deve ter no máximo 500 caracteres']
  },
  frequencia: {
    type: String,
    required: [true, 'Frequência é obrigatória'],
    enum: ['diario', 'semanal', 'mensal'],
    default: 'diario'
  },
  categoria: {
    type: String,
    enum: ['saude', 'estudo', 'trabalho', 'pessoal', 'social', 'criativo'],
    default: 'pessoal'
  },
  dificuldade: {
    type: String,
    enum: ['facil', 'medio', 'dificil', 'lendario'],
    default: 'medio'
  },
  recompensaExperiencia: {
    type: Number,
    default: function () {
      const recompensas = { facil: 10, medio: 20, dificil: 35, lendario: 50 };
      return recompensas[this.dificuldade] || 20;
    }
  },
  icone: {
    type: String,
    default: 'espada'
  },
  cor: {
    type: String,
    default: '#8B5CF6' // Tema roxo
  },
  ativo: {
    type: Boolean,
    default: true
  },
  diasAlvo: {
    type: [String], // ['segunda', 'terca', etc] para hábitos semanais
    default: []
  },
  horarioLembrete: {
    type: String, // Formato HH:MM
    default: null
  },
  sequencia: {
    atual: { type: Number, default: 0 },
    maiorSequencia: { type: Number, default: 0 }
  },
  estatisticas: {
    totalConclusoes: { type: Number, default: 0 },
    totalPerdidos: { type: Number, default: 0 },
    taxaConclusao: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Calcular taxa de conclusão
esquemaHabito.methods.atualizarEstatisticas = function () {
  const total = this.estatisticas.totalConclusoes + this.estatisticas.totalPerdidos;
  this.estatisticas.taxaConclusao = total > 0 ? (this.estatisticas.totalConclusoes / total) * 100 : 0;
};

// Atualizar sequência
esquemaHabito.methods.atualizarSequencia = function (concluido) {
  if (concluido) {
    this.sequencia.atual += 1;
    if (this.sequencia.atual > this.sequencia.maiorSequencia) {
      this.sequencia.maiorSequencia = this.sequencia.atual;
    }
  } else {
    this.sequencia.atual = 0;
  }
};

module.exports = mongoose.model('Habito', esquemaHabito);
