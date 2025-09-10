const mongoose = require('mongoose');

const esquemaDesafio = new mongoose.Schema({
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
  tipoDesafio: {
    type: String,
    required: [true, 'Tipo de desafio é obrigatório'],
    enum: ['sequencia_7_dias', 'sequencia_30_dias', 'habitos_semana', 'xp_diario', 'nivel_rapido'],
    default: 'sequencia_7_dias'
  },
  status: {
    type: String,
    enum: ['pendente', 'aceito', 'recusado', 'em_andamento', 'concluido', 'expirado'],
    default: 'pendente'
  },
  dataInicio: {
    type: Date,
    default: Date.now
  },
  dataFim: {
    type: Date,
    required: [true, 'Data de fim é obrigatória']
  },
  dataResposta: {
    type: Date
  },
  resultado: {
    vencedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    pontuacaoRemetente: { type: Number, default: 0 },
    pontuacaoDestinatario: { type: Number, default: 0 },
    criterios: [{
      nome: String,
      valorRemetente: Number,
      valorDestinatario: Number
    }]
  },
  recompensa: {
    xpVencedor: { type: Number, default: 100 },
    xpPerdedor: { type: Number, default: 25 },
    tituloEspecial: String
  },
  mensagem: {
    type: String,
    maxlength: [200, 'Mensagem deve ter no máximo 200 caracteres']
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
esquemaDesafio.index({ remetente: 1, status: 1 });
esquemaDesafio.index({ destinatario: 1, status: 1 });
esquemaDesafio.index({ dataFim: 1, status: 'pendente' });

// Método para verificar se o desafio expirou
esquemaDesafio.methods.verificarExpiracao = function () {
  if (this.status === 'pendente' && new Date() > this.dataFim) {
    this.status = 'expirado';
    return true;
  }
  return false;
};

// Método para calcular pontuação baseada no tipo de desafio
esquemaDesafio.methods.calcularPontuacao = async function (usuarioId) {
  const Usuario = require('./User');
  const Habito = require('./Habit');
  const Progresso = require('./Progress');

  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) { return 0; }

  let pontuacao = 0;
  const hoje = new Date();
  const inicioDesafio = this.dataInicio;
  const fimDesafio = this.dataFim;

  switch (this.tipoDesafio) {
  case 'sequencia_7_dias': {
    // Verificar sequência de 7 dias consecutivos
    const progressos7Dias = await Progresso.find({
      idUsuario: usuarioId,
      data: { $gte: inicioDesafio, $lte: fimDesafio },
      status: 'concluido'
    });
    pontuacao = this.calcularSequenciaConsecutiva(progressos7Dias);
    break;
  }

  case 'sequencia_30_dias': {
    // Verificar sequência de 30 dias consecutivos
    const progressos30Dias = await Progresso.find({
      idUsuario: usuarioId,
      data: { $gte: inicioDesafio, $lte: fimDesafio },
      status: 'concluido'
    });
    pontuacao = this.calcularSequenciaConsecutiva(progressos30Dias);
    break;
  }

  case 'habitos_semana': {
    // Contar total de hábitos concluídos na semana
    const progressosSemana = await Progresso.find({
      idUsuario: usuarioId,
      data: { $gte: inicioDesafio, $lte: fimDesafio },
      status: 'concluido'
    });
    pontuacao = progressosSemana.length;
    break;
  }

  case 'xp_diario': {
    // XP ganho por dia durante o desafio
    const progressosXP = await Progresso.find({
      idUsuario: usuarioId,
      data: { $gte: inicioDesafio, $lte: fimDesafio },
      status: 'concluido'
    });
    pontuacao = progressosXP.reduce((total, p) => total + p.experienciaGanha, 0);
    break;
  }

  case 'nivel_rapido':
    // Nível alcançado durante o desafio
    pontuacao = usuario.nivel;
    break;
  }

  return pontuacao;
};

// Método auxiliar para calcular sequência consecutiva
esquemaDesafio.methods.calcularSequenciaConsecutiva = function (progressos) {
  if (progressos.length === 0) { return 0; }

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

module.exports = mongoose.model('Desafio', esquemaDesafio);
