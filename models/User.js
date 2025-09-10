const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const esquemaUsuario = new mongoose.Schema({
  nomeUsuario: {
    type: String,
    required: [true, 'Nome de usuário é obrigatório'],
    unique: true,
    trim: true,
    minlength: [3, 'Nome de usuário deve ter pelo menos 3 caracteres'],
    maxlength: [25, 'Nome de usuário deve ter no máximo 25 caracteres'] // Aumentado de 20 para 25
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, insira um email válido']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  experiencia: {
    type: Number,
    default: 0,
    min: 0
  },
  nivel: {
    type: Number,
    default: 1,
    min: 1
  },
  avatar: {
    tipo: { type: String, default: 'aspirante' }, // Tipo base do avatar
    nivel: { type: Number, default: 1 }, // Nível visual do avatar
    evolucao: { type: String, default: 'inicial' }, // Estágio de evolução
    desbloqueadoEm: { type: Date, default: Date.now }
  },
  personalizacaoAvatar: {
    arma: { 
      tipo: { type: String, default: 'espada_basica' },
      nivel: { type: Number, default: 1 },
      desbloqueadaEm: { type: Date, default: Date.now }
    },
    armadura: { 
      tipo: { type: String, default: 'manto_basico' },
      nivel: { type: Number, default: 1 },
      desbloqueadaEm: { type: Date, default: Date.now }
    },
    acessorio: { 
      tipo: { type: String, default: 'nenhum' },
      nivel: { type: Number, default: 1 },
      desbloqueadaEm: { type: Date, default: Date.now }
    },
    aura: { 
      tipo: { type: String, default: 'nenhuma' },
      intensidade: { type: Number, default: 0 },
      desbloqueadaEm: { type: Date, default: Date.now }
    },
    particulas: { 
      tipo: { type: String, default: 'nenhuma' },
      quantidade: { type: Number, default: 0 },
      desbloqueadaEm: { type: Date, default: Date.now }
    }
  },
  titulo: {
    type: String,
    default: 'Aspirante'
  },
  dataEntrada: {
    type: Date,
    default: Date.now
  },
  ultimaAtividade: {
    type: Date,
    default: Date.now
  },
  sequencia: {
    atual: { type: Number, default: 0 },
    maiorSequencia: { type: Number, default: 0 }
  },
  preferencias: {
    notificacoes: { type: Boolean, default: true },
    tema: { type: String, default: 'escuro', enum: ['escuro', 'hollow', 'carmesim'] },
    idioma: { type: String, default: 'pt-BR' }
  }
}, {
  timestamps: true
});

// Calcular nível baseado na experiência
esquemaUsuario.virtual('nivelCalculado').get(function () {
  return Math.floor(this.experiencia / 100) + 1; // 100 XP por nível
});

// Obter título baseado no nível
esquemaUsuario.virtual('tituloCalculado').get(function () {
  const nivel = this.nivelCalculado;
  if (nivel >= 31) {
    return 'Conjurador Supremo';
  }
  if (nivel >= 21) {
    return 'Guardião do Librarium';
  }
  if (nivel >= 11) {
    return 'Caçador';
  }
  return 'Aspirante';
});

// Criptografar senha antes de salvar
esquemaUsuario.pre('save', async function (next) {
  if (!this.isModified('senha')) {
    return next();
  }

  try {
    const sal = await bcrypt.genSalt(12);
    this.senha = await bcrypt.hash(this.senha, sal);
    next();
  } catch (erro) {
    next(erro);
  }
});

// Atualizar nível e título baseado na experiência
esquemaUsuario.pre('save', function (next) {
  this.nivel = this.nivelCalculado;
  this.titulo = this.tituloCalculado;

  // Atualizar avatar baseado no nível
  this.atualizarAvatarPorNivel();

  next();
});

// Método para migrar avatar antigo para novo formato
esquemaUsuario.methods.migrarAvatarAntigo = function() {
  if (typeof this.avatar === 'string') {
    const tipoAntigo = this.avatar;
    
    // Converter para novo formato
    this.avatar = {
      tipo: tipoAntigo,
      nivel: 1,
      evolucao: 'inicial',
      desbloqueadoEm: new Date()
    };
    
    // Aplicar evolução baseada no tipo antigo
    this.atualizarAvatarPorNivel();
    
    console.log(`Avatar migrado de '${tipoAntigo}' para novo formato`);
  }
};

// Método para atualizar avatar baseado no nível
esquemaUsuario.methods.atualizarAvatarPorNivel = function() {
  const {nivel} = this;
  
  if (nivel >= 50) {
    this.avatar.tipo = 'conjurador_supremo';
    this.avatar.evolucao = 'suprema';
    this.avatar.nivel = 5;
  } else if (nivel >= 40) {
    this.avatar.tipo = 'conjurador_avancado';
    this.avatar.evolucao = 'avancada';
    this.avatar.nivel = 4;
  } else if (nivel >= 31) {
    this.avatar.tipo = 'conjurador';
    this.avatar.evolucao = 'evoluida';
    this.avatar.nivel = 3;
  } else if (nivel >= 21) {
    this.avatar.tipo = 'guardiao';
    this.avatar.evolucao = 'intermediaria';
    this.avatar.nivel = 2;
  } else if (nivel >= 11) {
    this.avatar.tipo = 'cacador';
    this.avatar.evolucao = 'inicial';
    this.avatar.nivel = 1;
  } else {
    this.avatar.tipo = 'aspirante';
    this.avatar.evolucao = 'inicial';
    this.avatar.nivel = 1;
  }
};

// Método para desbloquear item de avatar
esquemaUsuario.methods.desbloquearItemAvatar = function(categoria, tipo, nivel = 1) {
  if (this.personalizacaoAvatar[categoria]) {
    this.personalizacaoAvatar[categoria].tipo = tipo;
    this.personalizacaoAvatar[categoria].nivel = nivel;
    this.personalizacaoAvatar[categoria].desbloqueadaEm = new Date();
    
    // Atualizar aura e partículas baseado no nível
    if (categoria === 'arma' || categoria === 'armadura') {
      this.atualizarEfeitosVisuais();
    }
  }
};

// Método para atualizar efeitos visuais baseado no equipamento
esquemaUsuario.methods.atualizarEfeitosVisuais = function() {
  const nivelArma = this.personalizacaoAvatar.arma.nivel;
  const nivelArmadura = this.personalizacaoAvatar.armadura.nivel;
  const nivelTotal = Math.max(nivelArma, nivelArmadura);
  
  // Aura baseada no nível total
  if (nivelTotal >= 5) {
    this.personalizacaoAvatar.aura.tipo = 'divina';
    this.personalizacaoAvatar.aura.intensidade = 100;
  } else if (nivelTotal >= 4) {
    this.personalizacaoAvatar.aura.tipo = 'magica';
    this.personalizacaoAvatar.aura.intensidade = 75;
  } else if (nivelTotal >= 3) {
    this.personalizacaoAvatar.aura.tipo = 'elemental';
    this.personalizacaoAvatar.aura.intensidade = 50;
  } else if (nivelTotal >= 2) {
    this.personalizacaoAvatar.aura.tipo = 'basica';
    this.personalizacaoAvatar.aura.intensidade = 25;
  } else {
    this.personalizacaoAvatar.aura.tipo = 'nenhuma';
    this.personalizacaoAvatar.aura.intensidade = 0;
  }
  
  // Partículas baseadas no nível
  if (nivelTotal >= 4) {
    this.personalizacaoAvatar.particulas.tipo = 'estrelas';
    this.personalizacaoAvatar.particulas.quantidade = 50;
  } else if (nivelTotal >= 3) {
    this.personalizacaoAvatar.particulas.tipo = 'faiscas';
    this.personalizacaoAvatar.particulas.quantidade = 30;
  } else if (nivelTotal >= 2) {
    this.personalizacaoAvatar.particulas.tipo = 'poeira';
    this.personalizacaoAvatar.particulas.quantidade = 15;
  } else {
    this.personalizacaoAvatar.particulas.tipo = 'nenhuma';
    this.personalizacaoAvatar.particulas.quantidade = 0;
  }
};

// Método para comparar senha
esquemaUsuario.methods.compararSenha = async function (senhaCandidata) {
  return bcrypt.compare(senhaCandidata, this.senha);
};

// Método para adicionar experiência
esquemaUsuario.methods.adicionarExperiencia = function (quantidade) {
  this.experiencia += quantidade;
  return this.save();
};

// Atualizar última atividade
esquemaUsuario.methods.atualizarUltimaAtividade = function () {
  this.ultimaAtividade = new Date();
  return this.save();
};

module.exports = mongoose.model('Usuario', esquemaUsuario);
