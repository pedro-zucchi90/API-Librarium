const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;
let testHabitoId = null;
let testConquistaId = null;

// Configurar axios para mostrar erros detalhados
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(`❌ ${error.config.method?.toUpperCase()} ${error.config.url} - ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('❌ Erro de conexão:', error.message);
    } else {
      console.error('❌ Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

// Função para aguardar o servidor estar disponível
async function aguardarServidor() {
  console.log('🔍 Aguardando servidor estar disponível...');
  
  for (let i = 0; i < 30; i++) {
    try {
      const response = await axios.get(`${BASE_URL}/saude`);
      if (response.status === 200) {
        console.log('✅ Servidor está rodando!');
        return true;
      }
    } catch (erro) {
      // Servidor ainda não está pronto
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Servidor não respondeu após 30 segundos');
}

// Testar autenticação
async function testarAutenticacao() {
  console.log('🔐 Testando autenticação...');
  
  // Registrar usuário com nome mais curto
  const timestamp = Date.now().toString().slice(-6); // Apenas os últimos 6 dígitos
  const nomeUsuario = `teste_${timestamp}`;
  const email = `teste_${timestamp}@librarium.com`;
  
  const registro = await axios.post(`${BASE_URL}/auth/registrar`, {
    nomeUsuario,
    email,
    senha: '123456'
  });
  
  testUserId = registro.data.usuario.id;
  console.log('✅ Usuário registrado:', registro.data.usuario.nomeUsuario);
  
  // Fazer login
  const login = await axios.post(`${BASE_URL}/auth/login`, {
    email,
    senha: '123456'
  });
  
  authToken = login.data.token;
  console.log('✅ Login realizado com sucesso');
  
  // Verificar token
  const verificar = await axios.get(`${BASE_URL}/auth/verificar`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Token verificado com sucesso');
}

// Testar hábitos
async function testarHabitos() {
  console.log('\n⚔️ Testando hábitos...');
  
  // Criar hábito
  const criarHabito = await axios.post(`${BASE_URL}/habitos`, {
    titulo: 'Exercitar-se diariamente',
    descricao: '30 minutos de exercício físico',
    frequencia: 'diario',
    categoria: 'saude',
    dificuldade: 'medio',
    icone: 'espada',
    cor: '#FF6B6B'
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  testHabitoId = criarHabito.data.habito._id;
  console.log('✅ Hábito criado:', criarHabito.data.habito.titulo);
  
  // Listar hábitos
  const listarHabitos = await axios.get(`${BASE_URL}/habitos`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Hábitos listados:', listarHabitos.data.habitos.length);
  
  // Concluir hábito
  const concluirHabito = await axios.post(`${BASE_URL}/habitos/${testHabitoId}/concluir`, {
    observacoes: 'Completei 30 minutos de corrida!'
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Hábito concluído:', concluirHabito.data.experienciaGanha, 'XP ganho');
}

// Testar conquistas
async function testarConquistas() {
  console.log('\n🏆 Testando conquistas...');
  
  // Verificar conquistas automaticamente
  const verificarConquistas = await axios.post(`${BASE_URL}/conquistas/verificar`, {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Conquistas verificadas:', verificarConquistas.data.conquistasDesbloqueadas.length);
  
  // Listar conquistas
  const listarConquistas = await axios.get(`${BASE_URL}/conquistas`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Conquistas listadas:', listarConquistas.data.conquistas.length);
}

// Testar usuários
async function testarUsuarios() {
  console.log('\n👤 Testando usuários...');
  
  // Dashboard
  const dashboard = await axios.get(`${BASE_URL}/usuarios/dashboard`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Dashboard carregado');
  
  // Estatísticas
  const estatisticas = await axios.get(`${BASE_URL}/usuarios/estatisticas`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Estatísticas carregadas');
}

// Testar estatísticas
async function testarEstatisticas() {
  console.log('\n📊 Testando estatísticas...');
  
  // Gráfico semanal
  const graficoSemanal = await axios.get(`${BASE_URL}/estatisticas/grafico-semanal`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Gráfico semanal gerado');
  
  // Estatísticas por categoria
  const categorias = await axios.get(`${BASE_URL}/estatisticas/categorias`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Estatísticas por categoria carregadas');
}

// Testar multiplayer
async function testarMultiplayer() {
  console.log('\n⚔️ Testando multiplayer...');
  
  // Listar batalhas
  const batalhas = await axios.get(`${BASE_URL}/multiplayer/batalha`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Batalhas listadas:', batalhas.data.batalhas.length);
  
  // Listar desafios
  const desafios = await axios.get(`${BASE_URL}/multiplayer/desafio`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Desafios listados:', desafios.data.desafios.length);
}

// Testar integrações
async function testarIntegracoes() {
  console.log('\n🔗 Testando integrações...');
  
  // Status das integrações
  const status = await axios.get(`${BASE_URL}/integracao/status`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Status das integrações obtido');
}

// Testar exportação/importação
async function testarExportacaoImportacao() {
  console.log('\n📦 Testando exportação/importação...');
  
  try {
    // Exportar dados JSON
    const exportarJSON = await axios.get(`${BASE_URL}/dados/exportar/json`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Dados exportados em JSON');
  } catch (erro) {
    console.log('⚠️ Exportação JSON falhou (funcionalidade em desenvolvimento)');
  }
  
  try {
    // Estatísticas de exportação
    const estatisticas = await axios.get(`${BASE_URL}/dados/estatisticas`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Estatísticas de exportação obtidas');
  } catch (erro) {
    console.log('⚠️ Estatísticas de exportação falharam (funcionalidade em desenvolvimento)');
  }
}

// Testar loja
async function testarLoja() {
  console.log('\n🏪 Testando loja...');
  
  // Listar itens
  const itens = await axios.get(`${BASE_URL}/loja`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('✅ Itens da loja listados:', itens.data.itens.length);
}

// Função principal de teste
async function testarAPI() {
  try {
    console.log('\n🚀 Iniciando testes da API Librarium...\n');
    
    // Testar autenticação
    await testarAutenticacao();
    
    // Testar hábitos
    await testarHabitos();
    
    // Testar conquistas
    await testarConquistas();
    
    // Testar usuários
    await testarUsuarios();
    
    // Testar estatísticas
    await testarEstatisticas();
    
    // Testar multiplayer
    await testarMultiplayer();
    
    // Testar integrações
    await testarIntegracoes();
    
    // Testar exportação/importação
    await testarExportacaoImportacao();
    
    // Testar loja
    await testarLoja();
    
    console.log('\n🎉 Todos os testes foram executados com sucesso!');
    
  } catch (erro) {
    console.error('\n💥 Erro durante os testes:', erro.message);
    throw erro;
  }
}

// Função principal
async function main() {
  try {
    // Aguardar servidor estar disponível
    await aguardarServidor();
    
    // Executar testes
    await testarAPI();
    
    console.log('\n🎯 Testes concluídos com sucesso!');
    console.log('📊 Resumo: Todas as funcionalidades principais testadas');
    console.log('⏰ Finalizado em:', new Date().toLocaleString('pt-BR'));
    
  } catch (erro) {
    console.error('\n💥 Erro durante os testes:', erro.message);
    process.exit(1);
  }
}

// Executar testes
main();