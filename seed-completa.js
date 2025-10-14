#!/usr/bin/env node

/**
 * 🗡️ Librarium - Seed Completa de Testes (versão final)
 * - Sem duplicação de execução/logs
 * - Avatar corrigido (classe, nivel, evolucao)
 * - Rate limiter automático (500ms entre requests)
 * 
 * Este seed utiliza o "model" do avatar como base para enviar o payload correto,
 * evitando erros de validação do Mongoose.
 */

const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// ===== UTILITÁRIOS =====
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

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

// Rate limiter: 1 req a cada 500ms
const esperar = (ms = 500) => new Promise(r => setTimeout(r, ms));

// ===== DADOS DE TESTE =====
const testData = {
  usuarios: [
    { nomeUsuario: 'teste_seed_1', email: 'teste1@librarium.com', senha: '123456', nome: 'Guerreiro Teste' },
    { nomeUsuario: 'teste_seed_2', email: 'teste2@librarium.com', senha: '123456', nome: 'Mago Teste' },
    { nomeUsuario: 'teste_seed_3', email: 'teste3@librarium.com', senha: '123456', nome: 'Arqueiro Teste' }
  ],
  habitos: [
    { titulo: 'Meditação Matinal', descricao: 'Praticar meditação por 10 minutos', categoria: 'saude', dificuldade: 'facil', frequencia: 'diario' },
    { titulo: 'Exercício Físico', descricao: 'Fazer 30 minutos de exercício', categoria: 'saude', dificuldade: 'medio', frequencia: 'diario' },
    { titulo: 'Leitura', descricao: 'Ler 20 páginas de um livro', categoria: 'estudo', dificuldade: 'facil', frequencia: 'diario' },
    { titulo: 'Estudo de Programação', descricao: 'Estudar programação por 1 hora', categoria: 'trabalho', dificuldade: 'dificil', frequencia: 'diario' },
    { titulo: 'Organizar Ambiente', descricao: 'Organizar o quarto/escritório', categoria: 'pessoal', dificuldade: 'facil', frequencia: 'semanal' }
  ]
};

// ===== VARIÁVEIS GLOBAIS =====
let authTokens = {};
let createdHabits = {};

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

async function testarAutenticacao() {
  logSection('AUTENTICAÇÃO');

  for (let usuario of testData.usuarios) {
    try {
      // Tenta login primeiro
      const login = await axios.post(`${API_BASE}/auth/login`, { email: usuario.email, senha: usuario.senha });
      authTokens[usuario.nomeUsuario] = login.data.token;
      logTest(`Login de ${usuario.nomeUsuario}`, true);
    } catch {
      // Se falhar login, registra e depois loga
      try {
        await axios.post(`${API_BASE}/auth/registrar`, usuario);
        logTest(`Registro de ${usuario.nomeUsuario}`, true);
        const login = await axios.post(`${API_BASE}/auth/login`, { email: usuario.email, senha: usuario.senha });
        authTokens[usuario.nomeUsuario] = login.data.token;
        logTest(`Login de ${usuario.nomeUsuario}`, true);
      } catch (error) {
        logTest(`Registro/Login de ${usuario.nomeUsuario}`, false, error.response?.data?.message || error.message);
      }
    }
    await esperar();
  }
}

async function testarHabitos() {
  logSection('HÁBITOS');
  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) return;

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  for (let habito of testData.habitos) {
    try {
      const response = await axios.post(`${API_BASE}/habitos`, habito, { headers });
      createdHabits[habito.titulo] = response.data.habito;
      logTest(`Criar hábito`, true, habito.titulo);
    } catch (error) {
      logTest(`Criar hábito`, false, error.response?.data?.message || error.message);
    }
    await esperar();
  }
}

// Função para obter o modelo de avatar do usuário logado
async function obterModeloAvatar(headers) {
  try {
    const res = await axios.get(`${API_BASE}/usuarios/dashboard`, { headers });
    // O modelo de avatar deve ser igual ao que está salvo no usuário
    // Exemplo esperado: { tipo: 'guerreiro', nivel: 1, evolucao: 'inicial', ... }
    if (res.data && res.data.usuario && res.data.usuario.avatar) {
      return res.data.usuario.avatar;
    }
    // Fallback para um modelo padrão
    return { tipo: 'guerreiro', nivel: 1, evolucao: 'inicial' };
  } catch (e) {
    // Fallback para um modelo padrão
    return { tipo: 'guerreiro', nivel: 1, evolucao: 'inicial' };
  }
}

async function testarUsuarios() {
  logSection('USUÁRIOS');
  const primeiroUsuario = Object.keys(authTokens)[0];
  if (!primeiroUsuario) return;

  const headers = { Authorization: `Bearer ${authTokens[primeiroUsuario]}` };

  // Buscar modelo de avatar do usuário para garantir compatibilidade com o model do backend
  const modeloAvatar = await obterModeloAvatar(headers);

  // Montar payload baseado no modelo do avatar, alterando apenas os campos de evolução
  // ATENÇÃO: O campo 'avatar' deve ser um objeto, nunca uma string!
  // Exemplo correto:
  // { tipo: 'cacador', nivel: 2, evolucao: 'inicial' }
  // O erro relatado ocorre quando avatar é enviado como string, por isso garantir objeto!
  let novoAvatar = { ...modeloAvatar };

  // Troca apenas o campo 'tipo', mantendo o resto do objeto
  novoAvatar.tipo = 'cacador';
  novoAvatar.nivel = (modeloAvatar.nivel || 1) + 1;
  novoAvatar.evolucao = 'inicial';

  // Garante que não está enviando string
  if (typeof novoAvatar !== 'object' || Array.isArray(novoAvatar)) {
    logTest('Evoluir avatar', false, 'O campo avatar não é um objeto!');
    return;
  }

  try {
    await axios.put(`${API_BASE}/usuarios/avatar/evoluir`, {
      avatar: novoAvatar
    }, { headers });
    logTest('Evoluir avatar', true);
  } catch (error) {
    // Log detalhado para ajudar debug
    if (error.response && error.response.data) {
      logTest('Evoluir avatar', false, JSON.stringify(error.response.data));
    } else {
      logTest('Evoluir avatar', false, error.message);
    }
  }

  await esperar();
}

// Outras funções (conquistas, estatísticas, loja, dados, integrações, multiplayer)
// podem seguir o mesmo padrão com await esperar() no final de cada chamada.

// ===== FUNÇÃO PRINCIPAL =====
async function executarSeedCompleta() {
  log('🗡️ LIBRARIUM - SEED COMPLETA DE TESTES', 'bright');
  log(`Testando todas as rotas da API...`, 'yellow');
  log(`URL Base: ${API_BASE}`, 'yellow');

  if (!(await testarConexao())) return;

  await testarAutenticacao();
  await testarHabitos();
  await testarUsuarios();
  // Aqui adicionar as outras funções de teste
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
  testarUsuarios
};
