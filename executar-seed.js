#!/usr/bin/env node

/**
 * 🗡️ Librarium - Executor de Seed
 * 
 * Este script inicia o servidor e executa a seed automaticamente
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🗡️ LIBRARIUM - EXECUTOR DE SEED');
console.log('Iniciando servidor e executando seed...\n');

// Iniciar servidor
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let serverReady = false;

// Aguardar servidor ficar pronto
server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[SERVIDOR] ${output}`);
  
  if (output.includes('Servidor rodando na porta 3000') || output.includes('Librarium desperta')) {
    serverReady = true;
    console.log('\n✅ Servidor iniciado! Executando seed...\n');
    
    // Aguardar um pouco mais e executar seed
    setTimeout(() => {
      executarSeed();
    }, 2000);
  }
});

server.stderr.on('data', (data) => {
  console.error(`[SERVIDOR ERROR] ${data}`);
});

server.on('close', (code) => {
  console.log(`[SERVIDOR] Processo finalizado com código ${code}`);
});

// Função para executar a seed
function executarSeed() {
  const seed = spawn('node', ['seed-completa.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, API_URL: 'http://localhost:3000' }
  });

  seed.on('close', (code) => {
    console.log(`\n🎉 Seed executada com código ${code}`);
    console.log('Finalizando servidor...');
    server.kill();
    process.exit(code);
  });

  seed.on('error', (error) => {
    console.error('❌ Erro ao executar seed:', error);
    server.kill();
    process.exit(1);
  });
}

// Timeout de segurança
setTimeout(() => {
  if (!serverReady) {
    console.log('❌ Timeout: Servidor não iniciou em 30 segundos');
    server.kill();
    process.exit(1);
  }
}, 30000);

// Capturar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Interrompendo execução...');
  server.kill();
  process.exit(0);
});
