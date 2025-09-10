module.exports = {
  // Configurações do sistema de avatar
  evolucao: {
    // Intervalo para verificação automática (em ms)
    verificarIntervalo: process.env.AVATAR_VERIFICACAO_INTERVALO || 5 * 60 * 1000,
    
    // Nível máximo do avatar
    nivelMaximo: process.env.AVATAR_MAX_NIVEL || 5,
    
    // Ativar verificação automática
    automatica: process.env.AVATAR_EVOLUCAO_AUTOMATICA !== 'false',
    
    // Ativar efeitos visuais
    efeitosAtivos: process.env.AVATAR_EFEITOS_ATIVOS !== 'false'
  },

  // Configurações de níveis
  niveis: {
    aspirante: { min: 1, max: 10, xpNecessario: 0 },
    cacador: { min: 11, max: 20, xpNecessario: 1000 },
    guardiao: { min: 21, max: 30, xpNecessario: 2000 },
    conjurador: { min: 31, max: 39, xpNecessario: 3000 },
    conjuradorAvancado: { min: 40, max: 49, xpNecessario: 4000 },
    conjuradorSupremo: { min: 50, max: 999, xpNecessario: 5000 }
  },

  // Configurações de equipamentos
  equipamentos: {
    // Níveis disponíveis para cada categoria
    niveis: [1, 2, 3, 4, 5],
    
    // Categorias de equipamento
    categorias: ['arma', 'armadura', 'acessorio', 'aura', 'particulas'],
    
    // Desbloqueios baseados em conquistas
    desbloqueiosConquistas: {
      arma: {
        20: { tipo: 'espada_rara', nivel: 3 },
        30: { tipo: 'espada_epica', nivel: 4 },
        50: { tipo: 'espada_lendaria', nivel: 5 }
      },
      armadura: {
        5: { tipo: 'armadura_rara', nivel: 4 },
        10: { tipo: 'armadura_epica', nivel: 5 }
      },
      acessorio: {
        1: { tipo: 'coroa_epica', nivel: 4 },
        3: { tipo: 'coroa_lendaria', nivel: 5 }
      }
    },
    
    // Desbloqueios baseados em sequências
    desbloqueiosSequencia: {
      arma: {
        50: { tipo: 'espada_persistencia', nivel: 4 },
        100: { tipo: 'espada_sequencia', nivel: 5 }
      }
    },
    
    // Desbloqueios baseados em XP
    desbloqueiosXP: {
      armadura: {
        5000: { tipo: 'armadura_conhecimento', nivel: 4 },
        10000: { tipo: 'armadura_experiencia', nivel: 5 }
      }
    }
  },

  // Configurações de efeitos visuais
  efeitos: {
    // Sistema de aura
    aura: {
      niveis: {
        2: { tipo: 'basica', intensidade: 25 },
        3: { tipo: 'elemental', intensidade: 50 },
        4: { tipo: 'magica', intensidade: 75 },
        5: { tipo: 'divina', intensidade: 100 }
      }
    },
    
    // Sistema de partículas
    particulas: {
      niveis: {
        2: { tipo: 'poeira', quantidade: 15 },
        3: { tipo: 'faiscas', quantidade: 30 },
        4: { tipo: 'estrelas', quantidade: 50 }
      }
    }
  },

  // Configurações de temas visuais
  temas: {
    aspirante: {
      corPrimaria: '#6B7280',
      corSecundaria: '#9CA3AF',
      corDestaque: '#D1D5DB',
      gradiente: 'linear-gradient(135deg, #6B7280, #9CA3AF)'
    },
    cacador: {
      corPrimaria: '#059669',
      corSecundaria: '#10B981',
      corDestaque: '#34D399',
      gradiente: 'linear-gradient(135deg, #059669, #10B981)'
    },
    guardiao: {
      corPrimaria: '#1D4ED8',
      corSecundaria: '#3B82F6',
      corDestaque: '#60A5FA',
      gradiente: 'linear-gradient(135deg, #1D4ED8, #3B82F6)'
    },
    conjurador: {
      corPrimaria: '#7C3AED',
      corSecundaria: '#8B5CF6',
      corDestaque: '#A78BFA',
      gradiente: 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
    },
    conjurador_avancado: {
      corPrimaria: '#DC2626',
      corSecundaria: '#EF4444',
      corDestaque: '#F87171',
      gradiente: 'linear-gradient(135deg, #DC2626, #EF4444)'
    },
    conjurador_supremo: {
      corPrimaria: '#F59E0B',
      corSecundaria: '#FBBF24',
      corDestaque: '#FCD34D',
      gradiente: 'linear-gradient(135deg, #F59E0B, #FBBF24)'
    }
  },

  // Configurações de performance
  performance: {
    // Cache de temas (em ms)
    cacheTemas: 5 * 60 * 1000,
    
    // Máximo de usuários para verificação em lote
    maxUsuariosLote: 100,
    
    // Timeout para operações de avatar (em ms)
    timeout: 30000
  },

  // Configurações de segurança
  seguranca: {
    // Validar dados de entrada
    validarEntrada: true,
    
    // Sanitizar dados
    sanitizar: true,
    
    // Rate limiting para rotas de avatar
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // máximo 100 requisições por IP
    }
  }
};
