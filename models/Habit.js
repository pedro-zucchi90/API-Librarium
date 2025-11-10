const mongoose = require('mongoose');

// Adiciona campo virtual computado ultimaDataConclusao,
// que retorna a última data de conclusão relacionada ao hábito (Progress mais recente),
// simulando o getter usado pelo frontend (habit_card.dart).

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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Campo virtual: ultimaDataConclusao
esquemaHabito.virtual('ultimaDataConclusao').get(async function () {
  // Precisa de require dinâmico para evitar issues de dependência
  const Progresso = require('./Progress');

  // Busca último progresso vinculado a este hábito
  // Retorna a data da conclusão mais recente (ou null se não houver progresso)
  const ultimo = await Progresso.findOne({ idHabito: this._id })
    .sort({ data: -1 })
    .select('data')
    .lean();
  return ultimo ? ultimo.data : null;
});

// Calcular taxa de conclusão
esquemaHabito.methods.atualizarEstatisticas = function () {
  const total = this.estatisticas.totalConclusoes + this.estatisticas.totalPerdidos;
  this.estatisticas.taxaConclusao = total > 0 ? (this.estatisticas.totalConclusoes / total) * 100 : 0;
};

// Atualizar sequência - verifica se foi realmente em dias consecutivos
esquemaHabito.methods.atualizarSequencia = async function (concluido) {
  const Progresso = require('./Progress');
  
  if (concluido) {
    // Buscar todos os progressos deste hábito ordenados por data
    const progressos = await Progresso.find({ 
      idHabito: this._id 
    }).sort({ data: -1 });
    
    if (progressos.length === 0) {
      // Primeiro progresso - sequência começa em 1
      this.sequencia.atual = 1;
      this.sequencia.maiorSequencia = 1;
      return;
    }
    
    // Agrupar por dia único
    const diasComProgresso = new Set();
    progressos.forEach(progresso => {
      const dataProgresso = new Date(progresso.data);
      dataProgresso.setHours(0, 0, 0, 0);
      diasComProgresso.add(dataProgresso.getTime());
    });
    
    // Converter para array ordenado
    const diasOrdenados = Array.from(diasComProgresso)
      .map(timestamp => new Date(timestamp))
      .sort((a, b) => a - b);
    
    if (diasOrdenados.length === 1) {
      // Primeiro dia - sequência começa em 1
      this.sequencia.atual = 1;
      this.sequencia.maiorSequencia = 1;
      return;
    }
    
    // Calcular sequência atual (começando do mais recente)
    let sequenciaAtual = 1;
    let maiorSequencia = 1;
    let sequenciaTemporaria = 1;
    
    // Calcular maior sequência de todos os tempos
    for (let i = 1; i < diasOrdenados.length; i++) {
      const dataAtual = diasOrdenados[i];
      const dataAnterior = diasOrdenados[i - 1];
      const diffDias = Math.floor((dataAtual - dataAnterior) / (1000 * 60 * 60 * 24));
      
      if (diffDias === 1) {
        sequenciaTemporaria++;
        maiorSequencia = Math.max(maiorSequencia, sequenciaTemporaria);
      } else {
        sequenciaTemporaria = 1;
      }
    }
    
    // Calcular sequência atual (dias consecutivos até hoje)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeTimestamp = hoje.getTime();
    
    if (diasComProgresso.has(hojeTimestamp)) {
      sequenciaTemporaria = 1;
      sequenciaAtual = 1;
      
      // Verificar dias anteriores consecutivos
      for (let i = 1; i <= 365; i++) {
        const dataAnterior = new Date(hoje);
        dataAnterior.setDate(hoje.getDate() - i);
        dataAnterior.setHours(0, 0, 0, 0);
        const dataAnteriorTimestamp = dataAnterior.getTime();
        
        if (diasComProgresso.has(dataAnteriorTimestamp)) {
          sequenciaTemporaria++;
          sequenciaAtual = sequenciaTemporaria;
        } else {
          break;
        }
      }
    } else {
      sequenciaAtual = 0;
    }
    
    this.sequencia.atual = sequenciaAtual;
    this.sequencia.maiorSequencia = Math.max(sequenciaAtual, maiorSequencia);
  } else {
    // Não completado - resetar sequência
    this.sequencia.atual = 0;
  }
};

module.exports = mongoose.model('Habito', esquemaHabito);
