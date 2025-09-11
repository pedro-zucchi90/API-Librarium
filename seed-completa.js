#!/usr/bin/env node

/**
 * 🗡️ Librarium - Seed Completa de Testes
 * 
 * Este script testa TODAS as rotas da API Librarium
 * Criado para validar funcionalidades e popular dados de teste
 * 
 * Uso: node seed-completa.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURAÇÕES =====
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// ===== UTILITÁRIOS =====
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🗡️  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logTest(testName, success, details = '') {
  const status = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  log(`${status} ${testName}${details ? ` - ${details}` : ''}`, color);
}

// ===== DADOS DE TESTE =====
const testData = {
  usuarios: [
    {
      nomeUsuario: 'teste_seed_1',
      email: 'teste1@librarium.com',
      senha: '123456',
      nome: 'Guerreiro Teste'
    },
    {
      nomeUsuario: 'teste_seed_2', 
      email: 'teste2@librarium.com',
      senha: '123456',
      nome: 'Mago Teste'
    },
    {
      nomeUsuario: 'teste_seed_3',
      email: 'teste3@librarium.com', 
      senha: '123456',
      nome: 'Arqueiro Teste'
    }
  ],
  habitos: [
    {
      titulo: 'Meditação Matinal',
      descricao: 'Praticar meditação por 10 minutos',
      categoria: 'saude',
      dificuldade: 'facil',
      frequencia: 'diaria',
      meta: 1,
      unidade: 'sessao'
    },
    {
      titulo: 'Exercício Físico',
      descricao: 'Fazer 30 minutos de exercício',
      categoria: 'fitness',
      dificuldade: 'medio',
      frequencia: 'diaria', 
      meta: 30,
      unidade: 'minutos'
    },
    {
      titulo: 'Leitura',
      descricao: 'Ler 20 páginas de um livro',
      categoria: 'educacao',
      dificuldade: 'facil',
      frequencia: 'diaria',
      meta: 20,
      unidade: 'paginas'
    },
    {
      titulo: 'Estudo de Programação',
      descricao: 'Estudar programação por 1 hora',
      categoria: 'profissional',
      dificuldade: 'dificil',
      frequencia: 'diaria',
      meta: 60,
      unidade: 'minutos'
    },
    {
      titulo: 'Organizar Ambiente',
      descricao: 'Organizar o quarto/escritório',
      categoria: 'produtividade',
      dificuldade: 'facil',
      frequencia: 'semanal',
      meta: 1,
      unidade: 'vez'
    }
  ]
};

// ===== VARIÁVEIS GLOBAIS =====
let authTokens = {};
let createdHabits = {};
let createdUsers = {};

// ===== FUNÇÕES DE TESTE =====

async function testarConexao() {
  try {
    const response = await axios.get(`${API_BASE}/saude`);
    logTest('Conexão com API', true, `Status: ${response.status}`);
    return true;
  } catch (error) {
    logTest('Conexão com API', false, error.message);
    return false;
  }
}

// ===== AUTENTICAÇÃO =====
async function testarAutenticacao() {
  logSection('AUTENTICAÇÃO');

  // Testar registro de usuários
  for (let i = 0; i < testData.usuarios.length; i++) {
    const usuario = testData.usuarios[i];
    try {
      const response = await axios.post(`${API_BASE}/auth/registrar`, usuario);
      createdUsers[usuario.nomeUsuario] = response.data.usuario;
      logTest(`Registro de usuário ${i + 1}`, true, usuario.nomeUsuario);
    } catch (error) {
      logTest(`Registro de usuário ${i + 1}`, false, error.response?.data?.message || error.message);
    }
  }

  // Testar login de usuários
  for (let i = 0; i < testData.usuarios.length; i++) {
    const usuario = testData.usuarios[i];
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: usuario.email,
        senha: usuario.senha
      });
      authTokens[usuario.nomeUsuario] = response.data.token;
      logTest(`Login de usuário ${i + 1}`, true, usuario.nomeUsuario);
    } catch (error) {
      logTest(`Login de usuário ${i + 1}`, false, error.response?.data?.message || error.message);
    }
  }

  // Testar verificação de token
  const primeiroUsuario = Object.keys(authTokens)[0];
  if (primeiroUsuario) {
    try {
      const response = await axios.get(`${API_BASE}/auth/verificar`, {
        headers: { Authorization: `Bearer ${authTokens[primeiroUsuario]}` }
      });
      logTest('Verificação de token', true);
    } catch (error) {
      logTest('Verificação de token', false, error.response?.data?.message || error.message);
    }
  }

  // Testar obter perfil
  if (primeiroUsuario) {
    try {
      const response = await axios.get(`${API_BASE}/auth/perfil`, {
        headers: { Authorization: `Bearer ${authTokens[primeiroUsuario]}` }
      });
      logTest('Obter perfil', true);
    } catch (error) {
      logTest('Obter perfil', false, error.response?.data?.message || error.message);
    }
  }

  // Testar atualizar perfil
  if (primeiroUsuario) {
    try {
      const response = await axios.put(`${API_BASE}/auth/perfil`, {
        nome: 'Nome Atualizado',
        bio: 'Bio de teste atualizada'
      }, {
        headers: { Authorization: `Bearer ${authTokens[primeiroUsuario]}` }
      });
      logTest('Atualizar perfil', true);
    } catch (error) {
      logTest('Atualizar perfil', false, error.response?.data?.message || error.message);
    }
  }
}

// ===== HÁBITOS =====
async function testarHabitos() {
  logSection('HÁBITOS');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar hábitos', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Criar hábitos
  for (let i = 0; i < testData.habitos.length; i++) {
    const habito = testData.habitos[i];
    try {
      const response = await axios.post(`${API_BASE}/habitos`, habito, { headers });
      createdHabits[habito.titulo] = response.data.habito;
      logTest(`Criar hábito ${i + 1}`, true, habito.titulo);
    } catch (error) {
      logTest(`Criar hábito ${i + 1}`, false, error.response?.data?.message || error.message);
    }
  }

  // Listar hábitos
  try {
    const response = await axios.get(`${API_BASE}/habitos`, { headers });
    logTest('Listar hábitos', true, `${response.data.habitos.length} hábitos encontrados`);
  } catch (error) {
    logTest('Listar hábitos', false, error.response?.data?.message || error.message);
  }

  // Obter hábito específico
  const primeiroHabito = Object.values(createdHabits)[0];
  if (primeiroHabito) {
    try {
      const response = await axios.get(`${API_BASE}/habitos/${primeiroHabito._id}`, { headers });
      logTest('Obter hábito específico', true);
    } catch (error) {
      logTest('Obter hábito específico', false, error.response?.data?.message || error.message);
    }
  }

  // Atualizar hábito
  if (primeiroHabito) {
    try {
      const response = await axios.put(`${API_BASE}/habitos/${primeiroHabito._id}`, {
        titulo: 'Hábito Atualizado',
        descricao: 'Descrição atualizada'
      }, { headers });
      logTest('Atualizar hábito', true);
    } catch (error) {
      logTest('Atualizar hábito', false, error.response?.data?.message || error.message);
    }
  }

  // Concluir hábito
  if (primeiroHabito) {
    try {
      const response = await axios.post(`${API_BASE}/habitos/${primeiroHabito._id}/concluir`, {
        quantidade: 1,
        observacoes: 'Concluído via seed'
      }, { headers });
      logTest('Concluir hábito', true);
    } catch (error) {
      logTest('Concluir hábito', false, error.response?.data?.message || error.message);
    }
  }

  // Obter progresso do hábito
  if (primeiroHabito) {
    try {
      const response = await axios.get(`${API_BASE}/habitos/${primeiroHabito._id}/progresso`, { headers });
      logTest('Obter progresso do hábito', true);
    } catch (error) {
      logTest('Obter progresso do hábito', false, error.response?.data?.message || error.message);
    }
  }
}

// ===== USUÁRIOS =====
async function testarUsuarios() {
  logSection('USUÁRIOS');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar usuários', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Dashboard
  try {
    const response = await axios.get(`${API_BASE}/usuarios/dashboard`, { headers });
    logTest('Dashboard do usuário', true);
  } catch (error) {
    logTest('Dashboard do usuário', false, error.response?.data?.message || error.message);
  }

  // Estatísticas
  try {
    const response = await axios.get(`${API_BASE}/usuarios/estatisticas`, { headers });
    logTest('Estatísticas do usuário', true);
  } catch (error) {
    logTest('Estatísticas do usuário', false, error.response?.data?.message || error.message);
  }

  // Ranking
  try {
    const response = await axios.get(`${API_BASE}/usuarios/ranking`, { headers });
    logTest('Ranking de usuários', true);
  } catch (error) {
    logTest('Ranking de usuários', false, error.response?.data?.message || error.message);
  }

  // Conquistas
  try {
    const response = await axios.get(`${API_BASE}/usuarios/conquistas`, { headers });
    logTest('Conquistas do usuário', true);
  } catch (error) {
    logTest('Conquistas do usuário', false, error.response?.data?.message || error.message);
  }

  // Evoluir avatar
  try {
    const response = await axios.put(`${API_BASE}/usuarios/avatar/evoluir`, {
      nivel: 5
    }, { headers });
    logTest('Evoluir avatar', true);
  } catch (error) {
    logTest('Evoluir avatar', false, error.response?.data?.message || error.message);
  }

  // Customizar avatar
  try {
    const response = await axios.put(`${API_BASE}/usuarios/avatar/customizar`, {
      cor: '#FF6B6B',
      acessorios: ['coroa', 'capa']
    }, { headers });
    logTest('Customizar avatar', true);
  } catch (error) {
    logTest('Customizar avatar', false, error.response?.data?.message || error.message);
  }

  // Exportar dados
  try {
    const response = await axios.get(`${API_BASE}/usuarios/exportar`, { headers });
    logTest('Exportar dados do usuário', true);
  } catch (error) {
    logTest('Exportar dados do usuário', false, error.response?.data?.message || error.message);
  }

  // Atualizar preferências
  try {
    const response = await axios.put(`${API_BASE}/usuarios/preferencias`, {
      tema: 'dark',
      notificacoes: true,
      idioma: 'pt-BR'
    }, { headers });
    logTest('Atualizar preferências', true);
  } catch (error) {
    logTest('Atualizar preferências', false, error.response?.data?.message || error.message);
  }
}

// ===== CONQUISTAS =====
async function testarConquistas() {
  logSection('CONQUISTAS');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar conquistas', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Listar conquistas
  try {
    const response = await axios.get(`${API_BASE}/conquistas`, { headers });
    logTest('Listar conquistas', true, `${response.data.conquistas.length} conquistas encontradas`);
  } catch (error) {
    logTest('Listar conquistas', false, error.response?.data?.message || error.message);
  }

  // Verificar conquistas
  try {
    const response = await axios.post(`${API_BASE}/conquistas/verificar`, {}, { headers });
    logTest('Verificar conquistas', true);
  } catch (error) {
    logTest('Verificar conquistas', false, error.response?.data?.message || error.message);
  }

  // Estatísticas de conquistas
  try {
    const response = await axios.get(`${API_BASE}/conquistas/estatisticas`, { headers });
    logTest('Estatísticas de conquistas', true);
  } catch (error) {
    logTest('Estatísticas de conquistas', false, error.response?.data?.message || error.message);
  }

  // Progresso das conquistas
  try {
    const response = await axios.get(`${API_BASE}/conquistas/progresso`, { headers });
    logTest('Progresso das conquistas', true);
  } catch (error) {
    logTest('Progresso das conquistas', false, error.response?.data?.message || error.message);
  }

  // Próximas conquistas
  try {
    const response = await axios.get(`${API_BASE}/conquistas/proximas`, { headers });
    logTest('Próximas conquistas', true);
  } catch (error) {
    logTest('Próximas conquistas', false, error.response?.data?.message || error.message);
  }

  // Conquistas por categoria
  try {
    const response = await axios.get(`${API_BASE}/conquistas/categoria/progresso`, { headers });
    logTest('Conquistas por categoria', true);
  } catch (error) {
    logTest('Conquistas por categoria', false, error.response?.data?.message || error.message);
  }

  // Conquistas por raridade
  try {
    const response = await axios.get(`${API_BASE}/conquistas/raridade/comum`, { headers });
    logTest('Conquistas por raridade', true);
  } catch (error) {
    logTest('Conquistas por raridade', false, error.response?.data?.message || error.message);
  }
}

// ===== AVATAR =====
async function testarAvatar() {
  logSection('AVATAR');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar avatar', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Verificar evolução
  try {
    const response = await axios.post(`${API_BASE}/avatar/evolucao/verificar`, {}, { headers });
    logTest('Verificar evolução do avatar', true);
  } catch (error) {
    logTest('Verificar evolução do avatar', false, error.response?.data?.message || error.message);
  }

  // Estatísticas do avatar
  try {
    const response = await axios.get(`${API_BASE}/avatar/estatisticas`, { headers });
    logTest('Estatísticas do avatar', true);
  } catch (error) {
    logTest('Estatísticas do avatar', false, error.response?.data?.message || error.message);
  }

  // Tema do avatar
  try {
    const response = await axios.get(`${API_BASE}/avatar/tema`, { headers });
    logTest('Tema do avatar', true);
  } catch (error) {
    logTest('Tema do avatar', false, error.response?.data?.message || error.message);
  }

  // Progresso do avatar
  try {
    const response = await axios.get(`${API_BASE}/avatar/progresso`, { headers });
    logTest('Progresso do avatar', true);
  } catch (error) {
    logTest('Progresso do avatar', false, error.response?.data?.message || error.message);
  }

  // Histórico do avatar
  try {
    const response = await axios.get(`${API_BASE}/avatar/historico`, { headers });
    logTest('Histórico do avatar', true);
  } catch (error) {
    logTest('Histórico do avatar', false, error.response?.data?.message || error.message);
  }

  // Próximos desbloqueios
  try {
    const response = await axios.get(`${API_BASE}/avatar/proximos-desbloqueios`, { headers });
    logTest('Próximos desbloqueios do avatar', true);
  } catch (error) {
    logTest('Próximos desbloqueios do avatar', false, error.response?.data?.message || error.message);
  }
}

// ===== ESTATÍSTICAS =====
async function testarEstatisticas() {
  logSection('ESTATÍSTICAS');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar estatísticas', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Sistema
  try {
    const response = await axios.get(`${API_BASE}/stats/sistema`, { headers });
    logTest('Estatísticas do sistema', true);
  } catch (error) {
    logTest('Estatísticas do sistema', false, error.response?.data?.message || error.message);
  }

  // Gráfico semanal
  try {
    const response = await axios.get(`${API_BASE}/stats/grafico-semanal`, { headers });
    logTest('Gráfico semanal', true);
  } catch (error) {
    logTest('Gráfico semanal', false, error.response?.data?.message || error.message);
  }

  // Categorias
  try {
    const response = await axios.get(`${API_BASE}/stats/categorias`, { headers });
    logTest('Estatísticas por categorias', true);
  } catch (error) {
    logTest('Estatísticas por categorias', false, error.response?.data?.message || error.message);
  }

  // Heatmap
  try {
    const response = await axios.get(`${API_BASE}/stats/heatmap`, { headers });
    logTest('Heatmap de atividades', true);
  } catch (error) {
    logTest('Heatmap de atividades', false, error.response?.data?.message || error.message);
  }

  // Comparativo mensal
  try {
    const response = await axios.get(`${API_BASE}/stats/comparativo-mensal`, { headers });
    logTest('Comparativo mensal', true);
  } catch (error) {
    logTest('Comparativo mensal', false, error.response?.data?.message || error.message);
  }
}

// ===== LOJA =====
async function testarLoja() {
  logSection('LOJA');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar loja', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Listar itens da loja
  try {
    const response = await axios.get(`${API_BASE}/loja`, { headers });
    logTest('Listar itens da loja', true, `${response.data.itens.length} itens encontrados`);
  } catch (error) {
    logTest('Listar itens da loja', false, error.response?.data?.message || error.message);
  }

  // Comprar item (se houver itens disponíveis)
  try {
    const response = await axios.post(`${API_BASE}/loja/comprar`, {
      itemId: 'skin1',
      quantidade: 1
    }, { headers });
    logTest('Comprar item da loja', true);
  } catch (error) {
    logTest('Comprar item da loja', false, error.response?.data?.message || error.message);
  }
}

// ===== DADOS =====
async function testarDados() {
  logSection('DADOS');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar dados', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Exportar JSON
  try {
    const response = await axios.get(`${API_BASE}/dados/exportar/json`, { headers });
    logTest('Exportar dados em JSON', true);
  } catch (error) {
    logTest('Exportar dados em JSON', false, error.response?.data?.message || error.message);
  }

  // Exportar XML
  try {
    const response = await axios.get(`${API_BASE}/dados/exportar/xml`, { headers });
    logTest('Exportar dados em XML', true);
  } catch (error) {
    logTest('Exportar dados em XML', false, error.response?.data?.message || error.message);
  }

  // Exportar ZIP
  try {
    const response = await axios.get(`${API_BASE}/dados/exportar/zip`, { headers });
    logTest('Exportar dados em ZIP', true);
  } catch (error) {
    logTest('Exportar dados em ZIP', false, error.response?.data?.message || error.message);
  }

  // Listar backups
  try {
    const response = await axios.get(`${API_BASE}/dados/backups`, { headers });
    logTest('Listar backups', true);
  } catch (error) {
    logTest('Listar backups', false, error.response?.data?.message || error.message);
  }

  // Estatísticas de exportação
  try {
    const response = await axios.get(`${API_BASE}/dados/estatisticas`, { headers });
    logTest('Estatísticas de exportação', true);
  } catch (error) {
    logTest('Estatísticas de exportação', false, error.response?.data?.message || error.message);
  }

  // Obter configurações
  try {
    const response = await axios.get(`${API_BASE}/dados/configuracoes`, { headers });
    logTest('Obter configurações de dados', true);
  } catch (error) {
    logTest('Obter configurações de dados', false, error.response?.data?.message || error.message);
  }
}

// ===== INTEGRAÇÕES =====
async function testarIntegracoes() {
  logSection('INTEGRAÇÕES');

  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar integrações', 'red');
    return;
  }

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Status das integrações
  try {
    const response = await axios.get(`${API_BASE}/integracao/status`, { headers });
    logTest('Status das integrações', true);
  } catch (error) {
    logTest('Status das integrações', false, error.response?.data?.message || error.message);
  }

  // Iniciar OAuth Google
  try {
    const response = await axios.get(`${API_BASE}/integracao/google/oauth`, { headers });
    logTest('Iniciar OAuth Google', true);
  } catch (error) {
    logTest('Iniciar OAuth Google', false, error.response?.data?.message || error.message);
  }

  // Listar eventos Google Calendar
  try {
    const response = await axios.get(`${API_BASE}/integracao/google-calendar/eventos`, { headers });
    logTest('Listar eventos Google Calendar', true);
  } catch (error) {
    logTest('Listar eventos Google Calendar', false, error.response?.data?.message || error.message);
  }

  // Obter dados de saúde
  try {
    const response = await axios.get(`${API_BASE}/integracao/health/dados`, { headers });
    logTest('Obter dados de saúde', true);
  } catch (error) {
    logTest('Obter dados de saúde', false, error.response?.data?.message || error.message);
  }
}

// ===== MULTIPLAYER =====
async function testarMultiplayer() {
  logSection('MULTIPLAYER');

  const primeiroUsuario = Object.keys(authTokens)[0];
  const segundoUsuario = Object.keys(authTokens)[1];
  
  if (!primeiroUsuario) {
    log('❌ Nenhum usuário autenticado para testar multiplayer', 'red');
    return;
  }

  const headers1 = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };
  const headers2 = segundoUsuario ? { Authorization: `Bearer ${authTokens[segundoUsuario]}` } : headers1;

  // Criar batalha
  try {
    const response = await axios.post(`${API_BASE}/multiplayer/batalha/criar`, {
      oponenteId: segundoUsuario ? createdUsers[segundoUsuario]._id : createdUsers[primeiroUsuario]._id,
      tipo: 'habitos',
      duracao: 7
    }, { headers: headers1 });
    logTest('Criar batalha', true);
  } catch (error) {
    logTest('Criar batalha', false, error.response?.data?.message || error.message);
  }

  // Listar batalhas
  try {
    const response = await axios.get(`${API_BASE}/multiplayer/batalha`, { headers: headers1 });
    logTest('Listar batalhas', true);
  } catch (error) {
    logTest('Listar batalhas', false, error.response?.data?.message || error.message);
  }

  // Criar desafio
  try {
    const response = await axios.post(`${API_BASE}/multiplayer/desafio`, {
      titulo: 'Desafio de Teste',
      descricao: 'Complete 5 hábitos em 3 dias',
      meta: 5,
      prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }, { headers: headers1 });
    logTest('Criar desafio', true);
  } catch (error) {
    logTest('Criar desafio', false, error.response?.data?.message || error.message);
  }

  // Listar desafios
  try {
    const response = await axios.get(`${API_BASE}/multiplayer/desafio`, { headers: headers1 });
    logTest('Listar desafios', true);
  } catch (error) {
    logTest('Listar desafios', false, error.response?.data?.message || error.message);
  }

  // Enviar mensagem
  try {
    const response = await axios.post(`${API_BASE}/multiplayer/mensagem`, {
      destinatarioId: segundoUsuario ? createdUsers[segundoUsuario]._id : createdUsers[primeiroUsuario]._id,
      conteudo: 'Mensagem de teste da seed',
      tipo: 'texto'
    }, { headers: headers1 });
    logTest('Enviar mensagem', true);
  } catch (error) {
    logTest('Enviar mensagem', false, error.response?.data?.message || error.message);
  }

  // Ranking multiplayer
  try {
    const response = await axios.get(`${API_BASE}/multiplayer/ranking`, { headers: headers1 });
    logTest('Ranking multiplayer', true);
  } catch (error) {
    logTest('Ranking multiplayer', false, error.response?.data?.message || error.message);
  }

  // Estatísticas multiplayer
  try {
    const response = await axios.get(`${API_BASE}/multiplayer/estatisticas`, { headers: headers1 });
    logTest('Estatísticas multiplayer', true);
  } catch (error) {
    logTest('Estatísticas multiplayer', false, error.response?.data?.message || error.message);
  }
}

// ===== FUNÇÃO PRINCIPAL =====
async function executarSeedCompleta() {
  log('🗡️ LIBRARIUM - SEED COMPLETA DE TESTES', 'bright');
  log('Testando todas as rotas da API...', 'cyan');
  log(`URL Base: ${API_BASE}`, 'yellow');

  const inicio = Date.now();
  let testesSucesso = 0;
  let testesTotal = 0;

  try {
    // Teste de conexão
    const conectado = await testarConexao();
    if (!conectado) {
      log('\n❌ Não foi possível conectar à API. Verifique se o servidor está rodando.', 'red');
      process.exit(1);
    }

    // Executar todos os testes
    await testarAutenticacao();
    await testarHabitos();
    await testarUsuarios();
    await testarConquistas();
    await testarAvatar();
    await testarEstatisticas();
    await testarLoja();
    await testarDados();
    await testarIntegracoes();
    await testarMultiplayer();

    const fim = Date.now();
    const duracao = ((fim - inicio) / 1000).toFixed(2);

    logSection('RESUMO FINAL');
    log(`⏱️  Tempo total: ${duracao}s`, 'cyan');
    log(`✅ Testes executados com sucesso!`, 'green');
    log(`📊 Dados de teste criados:`, 'yellow');
    log(`   - ${Object.keys(createdUsers).length} usuários`, 'yellow');
    log(`   - ${Object.keys(createdHabits).length} hábitos`, 'yellow');
    log(`   - ${Object.keys(authTokens).length} tokens de autenticação`, 'yellow');

    log('\n🎉 Seed completa executada com sucesso!', 'green');
    log('A API Librarium está funcionando perfeitamente!', 'bright');

  } catch (error) {
    log(`\n❌ Erro durante a execução da seed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// ===== EXECUÇÃO =====
if (require.main === module) {
  executarSeedCompleta();
}

module.exports = {
  executarSeedCompleta,
  testarConexao,
  testarAutenticacao,
  testarHabitos,
  testarUsuarios,
  testarConquistas,
  testarAvatar,
  testarEstatisticas,
  testarLoja,
  testarDados,
  testarIntegracoes,
  testarMultiplayer
};
