#!/usr/bin/env node

/**
 * 🧪 Script de Teste - Google OAuth Configuration
 * 
 * Este script testa se as configurações do Google OAuth estão corretas
 */

require('dotenv').config();

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(`${title}`, 'bold');
  console.log('='.repeat(50));
}

async function testEnvironmentVariables() {
  logSection('🔧 Testando Variáveis de Ambiente');
  
  const requiredVars = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'GOOGLE_REDIRECT_URI': process.env.GOOGLE_REDIRECT_URI
  };

  let allPresent = true;

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      // Mascarar valores sensíveis
      let displayValue = value;
      if (key === 'GOOGLE_CLIENT_SECRET') {
        displayValue = value.length > 10 ? 
          `${value.substring(0, 10)}...` : 
          '[OCULTO]';
      } else if (key === 'GOOGLE_CLIENT_ID') {
        displayValue = value.length > 20 ? 
          `${value.substring(0, 20)}...` : 
          value;
      }
      
      log(`✅ ${key}: ${displayValue}`, 'green');
    } else {
      log(`❌ ${key}: NÃO CONFIGURADO`, 'red');
      allPresent = false;
    }
  });

  if (!allPresent) {
    log('\n⚠️  Algumas variáveis não estão configuradas!', 'yellow');
    log('Verifique o arquivo .env e siga o guia GOOGLE_APIS_CONFIGURATION.md', 'yellow');
    return false;
  }

  log('\n✅ Todas as variáveis de ambiente estão configuradas!', 'green');
  return true;
}

function validateGoogleCredentials() {
  logSection('🔐 Validando Credenciais do Google');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  // Validar formato do Client ID
  if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
    log('❌ GOOGLE_CLIENT_ID não está no formato correto', 'red');
    log('   Formato esperado: 123456789-abcdef.apps.googleusercontent.com', 'yellow');
    return false;
  }

  // Validar formato do Client Secret
  if (!clientSecret || !clientSecret.startsWith('GOCSPX-')) {
    log('❌ GOOGLE_CLIENT_SECRET não está no formato correto', 'red');
    log('   Formato esperado: GOCSPX-abcdef123456', 'yellow');
    return false;
  }

  // Validar URI de redirecionamento
  if (!redirectUri || (!redirectUri.includes('localhost') && !redirectUri.includes('https://'))) {
    log('❌ GOOGLE_REDIRECT_URI não está configurada corretamente', 'red');
    log('   Para desenvolvimento: http://localhost:3000/api/integracao/google/oauth/callback', 'yellow');
    log('   Para produção: https://seu-dominio.com/api/integracao/google/oauth/callback', 'yellow');
    return false;
  }

  log('✅ Todas as credenciais estão no formato correto!', 'green');
  return true;
}

function generateAuthUrl() {
  logSection('🔗 URL de Autorização OAuth');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GOOGLE_REDIRECT_URI);
  
  const authUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=email profile&` +
    `response_type=code&` +
    `access_type=offline`;

  log('🔗 URL de autorização gerada:', 'blue');
  log(authUrl, 'blue');
  log('\n💡 Para testar OAuth, cole a URL acima no navegador', 'yellow');
  log('⚠️  Certifique-se de que o servidor está rodando antes de testar', 'yellow');
  
  return authUrl;
}

function checkRedirectUriConfiguration() {
  logSection('🔄 Verificando Configuração de Redirect URI');
  
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  
  if (redirectUri.includes('localhost')) {
    log('✅ Configurado para desenvolvimento local', 'green');
    log('📝 Certifique-se de que esta URI está configurada no Google Console:', 'blue');
    log(`   ${redirectUri}`, 'blue');
  } else if (redirectUri.includes('https://')) {
    log('✅ Configurado para produção', 'green');
    log('📝 Certifique-se de que esta URI está configurada no Google Console:', 'blue');
    log(`   ${redirectUri}`, 'blue');
  } else {
    log('❌ URI de redirecionamento mal configurada', 'red');
    return false;
  }

  log('\n📋 Checklist de configuração no Google Console:', 'yellow');
  log('1. Acesse: https://console.cloud.google.com/', 'blue');
  log('2. Vá em "APIs e serviços" > "Credenciais"', 'blue');
  log('3. Clique no seu OAuth 2.0 Client ID', 'blue');
  log('4. Verifique se a URI de redirecionamento está listada:', 'blue');
  log(`   ${redirectUri}`, 'blue');
  
  return true;
}

function showNextSteps() {
  logSection('🎯 Próximos Passos');
  
  log('1. ✅ Configuração básica concluída', 'green');
  log('2. 🚀 Inicie o servidor: npm run dev', 'blue');
  log('3. 🧪 Teste o OAuth usando a URL gerada acima', 'blue');
  log('4. 📱 Configure o frontend para usar as credenciais', 'blue');
  log('5. 🚀 Faça deploy em produção quando necessário', 'blue');
  
  log('\n📚 Documentação útil:', 'yellow');
  log('• Google OAuth: https://developers.google.com/identity/protocols/oauth2', 'blue');
  log('• Guia do projeto: GOOGLE_APIS_CONFIGURATION.md', 'blue');
}

async function runAllTests() {
  console.clear();
  log('🧪 INICIANDO TESTES DO GOOGLE OAUTH', 'bold');
  log('='.repeat(50));

  const results = {
    environment: await testEnvironmentVariables(),
    credentials: false,
    redirectUri: false
  };

  if (results.environment) {
    results.credentials = validateGoogleCredentials();
    results.redirectUri = checkRedirectUriConfiguration();
  }

  // Gerar URL de autorização se tudo estiver OK
  if (results.environment && results.credentials) {
    generateAuthUrl();
  }

  // Resumo final
  logSection('📊 RESUMO DOS TESTES');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    const color = passed ? 'green' : 'red';
    log(`${test.toUpperCase()}: ${status}`, color);
  });

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    log('\n🎉 TODOS OS TESTES PASSARAM!', 'green');
    log('✅ Suas configurações do Google OAuth estão corretas!', 'green');
    showNextSteps();
  } else {
    log('\n⚠️  ALGUNS TESTES FALHARAM', 'yellow');
    log('📖 Consulte o arquivo GOOGLE_APIS_CONFIGURATION.md para resolver os problemas', 'yellow');
  }

  return allPassed;
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Erro fatal: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  testEnvironmentVariables,
  validateGoogleCredentials,
  generateAuthUrl,
  checkRedirectUriConfiguration,
  runAllTests
};
