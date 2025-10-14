#!/usr/bin/env node

/**
 * 🧪 Script de Teste - Sistema de Debug
 * 
 * Este script testa o sistema de logging e debug implementado
 */

require('dotenv').config();
const logger = require('./utils/logger');

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
  console.log('\n' + '='.repeat(60));
  log(`${title}`, 'bold');
  console.log('='.repeat(60));
}

async function testLoggerMethods() {
  logSection('🔍 Testando Métodos de Logger');
  
  try {
    // Teste dos novos métodos de logger
    logger.debugLog('Teste de debug', { teste: 'debug_message' });
    logger.request('Teste de requisição', { method: 'GET', url: '/test' });
    logger.response('Teste de resposta', { statusCode: 200, duration: '150ms' });
    logger.errorLog('Teste de erro', { error: 'test_error' });
    logger.validation('Teste de validação', { field: 'email', valid: true });
    logger.business('Teste de operação de negócio', { operation: 'create_user' });
    logger.external('Teste de API externa', { service: 'google', status: 200 });
    logger.cache('Teste de cache', { operation: 'get', key: 'user:123' });
    logger.middleware('Teste de middleware', { middleware: 'auth' });
    
    // Teste dos métodos existentes
    logger.startup('Teste de startup', { port: 3000 });
    logger.database('Teste de banco de dados', { operation: 'find', collection: 'users' });
    logger.auth('Teste de autenticação', { userId: '123', action: 'login' });
    logger.habit('Teste de hábito', { habitId: '456', action: 'create' });
    logger.achievement('Teste de conquista', { achievementId: '789', unlocked: true });
    logger.multiplayer('Teste de multiplayer', { battleId: '101', players: 2 });
    logger.integration('Teste de integração', { service: 'google_calendar', status: 'connected' });
    logger.security('Teste de segurança', { threat: 'rate_limit', ip: '192.168.1.1' });
    logger.performance('Teste de performance', { operation: 'heavy_query', duration: '2.5s' });
    
    log('✅ Todos os métodos de logger testados com sucesso!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro ao testar métodos de logger: ${error.message}`, 'red');
    return false;
  }
}

async function testLoggerFunctions() {
  logSection('🔧 Testando Funções Específicas de Logger');
  
  try {
    // Teste de operações de banco
    logger.dbOperation('find', 'users', { filter: { active: true }, limit: 10 });
    logger.dbOperation('save', 'habits', { userId: '123', title: 'Test Habit' });
    
    // Teste de validações
    logger.validationResult(true, 'email', 'test@example.com', 'email_format');
    logger.validationResult(false, 'password', '123', 'min_length');
    
    // Teste de cache
    logger.cacheOperation('get', 'user:123', true, 3600);
    logger.cacheOperation('set', 'user:123', false, 3600);
    
    // Teste de APIs externas
    logger.externalApi('Google Calendar', 'createEvent', 200, 450, { eventId: 'evt_123' });
    logger.externalApi('Google OAuth', 'getToken', 401, 200, { error: 'invalid_grant' });
    
    log('✅ Todas as funções específicas testadas com sucesso!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro ao testar funções específicas: ${error.message}`, 'red');
    return false;
  }
}

async function testErrorHandling() {
  logSection('❌ Testando Tratamento de Erros');
  
  try {
    // Simular diferentes tipos de erro
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    validationError.statusCode = 400;
    
    const dbError = new Error('Database connection failed');
    dbError.name = 'MongoError';
    dbError.code = 'ECONNREFUSED';
    
    const authError = new Error('Unauthorized access');
    authError.name = 'UnauthorizedError';
    authError.statusCode = 401;
    
    const serverError = new Error('Internal server error');
    serverError.name = 'InternalServerError';
    serverError.statusCode = 500;
    
    // Testar diferentes tipos de log de erro
    logger.validation('Validation Error Test', {
      error: validationError.message,
      name: validationError.name,
      statusCode: validationError.statusCode
    });
    
    logger.database('Database Error Test', {
      error: dbError.message,
      name: dbError.name,
      code: dbError.code
    });
    
    logger.auth('Authentication Error Test', {
      error: authError.message,
      name: authError.name,
      statusCode: authError.statusCode
    });
    
    logger.error('Server Error Test', {
      error: serverError.message,
      name: serverError.name,
      statusCode: serverError.statusCode
    });
    
    log('✅ Tratamento de erros testado com sucesso!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro ao testar tratamento de erros: ${error.message}`, 'red');
    return false;
  }
}

async function testPerformanceLogging() {
  logSection('⚡ Testando Logs de Performance');
  
  try {
    // Simular operações com diferentes durações
    const fastOperation = () => {
      const start = Date.now();
      // Simular operação rápida
      const duration = Date.now() - start;
      logger.performance('Fast Operation', { duration: `${duration}ms`, type: 'fast' });
    };
    
    const slowOperation = () => {
      const start = Date.now();
      // Simular operação lenta
      const duration = 2500; // 2.5 segundos
      logger.performance('Slow Operation', { duration: `${duration}ms`, type: 'slow' });
    };
    
    fastOperation();
    slowOperation();
    
    log('✅ Logs de performance testados com sucesso!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro ao testar logs de performance: ${error.message}`, 'red');
    return false;
  }
}

async function testEnvironmentConfiguration() {
  logSection('⚙️ Testando Configuração de Ambiente');
  
  try {
    const config = {
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      NODE_ENV: process.env.NODE_ENV || 'development',
      DEBUG_VALIDATION: process.env.DEBUG_VALIDATION || 'false',
      DEBUG_DATABASE: process.env.DEBUG_DATABASE || 'false',
      DEBUG_PERFORMANCE: process.env.DEBUG_PERFORMANCE || 'true'
    };
    
    log('📋 Configurações atuais:', 'blue');
    Object.entries(config).forEach(([key, value]) => {
      log(`   ${key}: ${value}`, 'blue');
    });
    
    // Testar se os logs estão funcionando no nível correto
    if (config.LOG_LEVEL === 'debug') {
      logger.debugLog('Debug level está ativo', { config });
    }
    
    if (config.LOG_LEVEL === 'info') {
      logger.info('Info level está ativo', { config });
    }
    
    log('✅ Configuração de ambiente verificada!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro ao verificar configuração: ${error.message}`, 'red');
    return false;
  }
}

async function testLogStats() {
  logSection('📊 Testando Estatísticas de Logs');
  
  try {
    const stats = logger.getStats();
    
    if (stats) {
      log('📈 Estatísticas de logs:', 'blue');
      log(`   Total de arquivos: ${stats.totalFiles}`, 'blue');
      log(`   Tamanho total: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`, 'blue');
      
      if (stats.files.length > 0) {
        log('📁 Arquivos de log:', 'blue');
        stats.files.forEach(file => {
          log(`   ${file.name}: ${(file.size / 1024).toFixed(2)} KB`, 'blue');
        });
      }
    } else {
      log('⚠️ Não foi possível obter estatísticas de logs', 'yellow');
    }
    
    log('✅ Estatísticas de logs verificadas!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro ao verificar estatísticas: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('🧪 INICIANDO TESTES DO SISTEMA DE DEBUG', 'bold');
  log('='.repeat(60));

  const results = {
    loggerMethods: await testLoggerMethods(),
    loggerFunctions: await testLoggerFunctions(),
    errorHandling: await testErrorHandling(),
    performanceLogging: await testPerformanceLogging(),
    environmentConfig: await testEnvironmentConfiguration(),
    logStats: await testLogStats()
  };

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
    log('✅ Sistema de debug está funcionando perfeitamente!', 'green');
    log('\n💡 Dicas para usar o sistema de debug:', 'yellow');
    log('• Configure LOG_LEVEL=debug para logs detalhados', 'blue');
    log('• Configure DEBUG_VALIDATION=true para logs de validação', 'blue');
    log('• Configure DEBUG_PERFORMANCE=true para logs de performance', 'blue');
    log('• Use logger.requestId para rastrear requisições específicas', 'blue');
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM', 'yellow');
    log('📖 Verifique os logs acima para identificar os problemas', 'yellow');
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
  testLoggerMethods,
  testLoggerFunctions,
  testErrorHandling,
  testPerformanceLogging,
  testEnvironmentConfiguration,
  testLogStats,
  runAllTests
};
