const mongoose = require('mongoose');

const esquemaBatalha = new mongoose.Schema({
  jogador1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Jogador 1 é obrigatório']
  },
  jogador2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Jogador 2 é obrigatório']
  },
  tipoBatalha: {
    type: String,
    enum: ['sequencia', 'xp_diario', 'habitos_concluidos', 'nivel_rapido', 'desafio_personalizado'],
    required: [true, 'Tipo de batalha é obrigatório']
  },
  status: {
    type: String,
    enum: ['aguardando', 'em_andamento', 'concluida', 'cancelada'],
    default: 'aguardando'
  },
  dataInicio: {
    type: Date,
    default: Date.now
  },
  dataFim: {
    type: Date,
    required: [true, 'Data de fim é obrigatória']
  },
  duracao: {
    type: Number, // em minutos
    required: [true, 'Duração é obrigatória']
  },
  criterios: [{
    nome: String,
    descricao: String,
    peso: { type: Number, default: 1 },
    tipo: { type: String, enum: ['sequencia', 'contagem', 'soma', 'media'] }
  }],
  pontuacoes: {
    jogador1: {
      pontos: { type: Number, default: 0 },
      sequencia: { type: Number, default: 0 },
      habitosConcluidos: { type: Number, default: 0 },
      xpGanho: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 }
    },
    jogador2: {
      pontos: { type: Number, default: 0 },
      sequencia: { type: Number, default: 0 },
      habitosConcluidos: { type: Number, default: 0 },
      xpGanho: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 }
    }
  },
  resultado: {
    vencedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    empate: { type: Boolean, default: false },
    diferencaPontos: Number,
    detalhes: String
  },
  recompensas: {
    vencedor: {
      xp: { type: Number, default: 100 },
      titulo: String,
      itemEspecial: String
    },
    perdedor: {
      xp: { type: Number, default: 25 },
      consolacao: String
    }
  },
  historico: [{
    acao: String,
    jogador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    timestamp: { type: Date, default: Date.now },
    detalhes: mongoose.Schema.Types.Mixed
  }],
  configuracao: {
    modoPrivado: { type: Boolean, default: false },
    permitirEspectadores: { type: Boolean, default: true },
    tempoResposta: { type: Number, default: 30 }, // em segundos
    maxTentativas: { type: Number, default: 3 }
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
esquemaBatalha.index({ jogador1: 1, status: 1 });
esquemaBatalha.index({ jogador2: 1, status: 1 });
esquemaBatalha.index({ status: 1, dataInicio: -1 });
esquemaBatalha.index({ tipoBatalha: 1, status: 1 });

// Método para calcular pontuação de um jogador
esquemaBatalha.methods.calcularPontuacao = async function (jogadorId) {
  const Usuario = require('./User');
  const Habito = require('./Habit');
  const Progresso = require('./Progress');

  const jogador = await Usuario.findById(jogadorId);
  if (!jogador) return 0;

  const inicioBatalha = this.dataInicio;
  const fimBatalha = this.dataFim;

  let pontos = 0;
  let sequencia = 0;
  let habitosConcluidos = 0;
  let xpGanho = 0;

  // Buscar progressos durante a batalha
  const progressos = await Progresso.find({
    idUsuario: jogadorId,
    data: { $gte: inicioBatalha, $lte: fimBatalha },
    status: 'concluido'
  });

  // Calcular métricas baseadas no tipo de batalha
  switch (this.tipoBatalha) {
    case 'sequencia_7_dias': {
      const progressos7Dias = await Progresso.find({
        idUsuario: jogadorId,
        data: { $gte: inicioBatalha, $lte: fimBatalha },
        status: 'concluido'
      });
      pontos = this.calcularSequenciaConsecutiva(progressos7Dias);
      break;
    }

    case 'sequencia_30_dias': {
      const progressos30Dias = await Progresso.find({
        idUsuario: jogadorId,
        data: { $gte: inicioBatalha, $lte: fimBatalha },
        status: 'concluido'
      });
      pontos = this.calcularSequenciaConsecutiva(progressos30Dias);
      break;
    }

    case 'habitos_semana': {
      const progressosSemana = await Progresso.find({
        idUsuario: jogadorId,
        data: { $gte: inicioBatalha, $lte: fimBatalha },
        status: 'concluido'
      });
      pontos = progressosSemana.length;
      break;
    }

    case 'xp_diario':
      // XP ganho por dia durante a batalha
      const progressosXP = await Progresso.find({
        idUsuario: jogadorId,
        data: { $gte: inicioBatalha, $lte: fimBatalha },
        status: 'concluido'
      });
      pontos = progressosXP.reduce((total, p) => total + p.experienciaGanha, 0);
      break;

    case 'nivel_rapido':
      // Nível alcançado durante a batalha
      pontos = jogador.nivel;
      break;
  }

  // Aplicar bônus baseado na sequência
  const bonus = Math.floor(sequencia / 7) * 5; // Bônus a cada 7 dias consecutivos

  return {
    pontos: pontos + bonus,
    sequencia,
    habitosConcluidos,
    xpGanho,
    bonus
  };
};

// Método para calcular pontuação personalizada
esquemaBatalha.methods.calcularPontuacaoPersonalizada = async function (jogadorId, progressos) {
  let pontos = 0;

  for (const criterio of this.criterios) {
    let valorCriterio = 0;

    switch (criterio.tipo) {
    case 'sequencia':
      valorCriterio = this.calcularSequenciaConsecutiva(progressos);
      break;
    case 'contagem':
      valorCriterio = progressos.length;
      break;
    case 'soma':
      valorCriterio = progressos.reduce((total, p) => total + p.experienciaGanha, 0);
      break;
    case 'media':
      valorCriterio = progressos.length > 0
        ? progressos.reduce((total, p) => total + p.experienciaGanha, 0) / progressos.length
        : 0;
      break;
    }

    pontos += valorCriterio * criterio.peso;
  }

  return pontos;
};

// Método auxiliar para calcular sequência consecutiva
esquemaBatalha.methods.calcularSequenciaConsecutiva = function (progressos) {
  if (progressos.length === 0) return 0;

  const datas = progressos.map(p => p.data.toISOString().split('T')[0]).sort();
  let sequenciaAtual = 1;
  let maiorSequencia = 1;

  for (let i = 1; i < datas.length; i++) {
    const dataAtual = new Date(datas[i]);
    const dataAnterior = new Date(datas[i - 1]);
    const diffDias = Math.floor((dataAtual - dataAnterior) / (1000 * 60 * 60 * 24));

    if (diffDias === 1) {
      sequenciaAtual++;
      maiorSequencia = Math.max(maiorSequencia, sequenciaAtual);
    } else {
      sequenciaAtual = 1;
    }
  }

  return maiorSequencia;
};

// Método para determinar o vencedor
esquemaBatalha.methods.determinarVencedor = function () {
  const pontos1 = this.pontuacoes.jogador1.pontos;
  const pontos2 = this.pontuacoes.jogador2.pontos;

  if (pontos1 > pontos2) {
    this.resultado = {
      vencedor: this.jogador1,
      empate: false,
      diferencaPontos: pontos1 - pontos2,
      detalhes: `${this.pontuacoes.jogador1.nomeUsuario} venceu com ${pontos1} pontos!`
    };
  } else if (pontos2 > pontos1) {
    this.resultado = {
      vencedor: this.jogador2,
      empate: false,
      diferencaPontos: pontos2 - pontos1,
      detalhes: `${this.pontuacoes.jogador2.nomeUsuario} venceu com ${pontos2} pontos!`
    };
  } else {
    this.resultado = {
      vencedor: null,
      empate: true,
      diferencaPontos: 0,
      detalhes: 'Empate! Ambos os jogadores tiveram a mesma pontuação.'
    };
  }

  return this.resultado;
};

// Método para adicionar ação ao histórico
esquemaBatalha.methods.adicionarAcao = function (acao, jogadorId, detalhes = null) {
  this.historico.push({
    acao,
    jogador: jogadorId,
    timestamp: new Date(),
    detalhes
  });
};

module.exports = mongoose.model('Batalha', esquemaBatalha);
