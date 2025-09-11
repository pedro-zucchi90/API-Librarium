#!/usr/bin/env node

/**
 * 🗡️ Librarium - Migração de Avatares
 * 
 * Este script migra avatares antigos (string) para o novo formato (objeto)
 */

const mongoose = require('mongoose');
const Usuario = require('./models/User');

// Conectar ao MongoDB
async function conectarBanco() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/librarium');
    console.log('🔮 MongoDB conectado para migração');
  } catch (erro) {
    console.error('❌ Erro ao conectar ao MongoDB:', erro);
    process.exit(1);
  }
}

// Migrar avatares
async function migrarAvatares() {
  try {
    console.log('🗡️ Iniciando migração de avatares...');
    
    // Buscar usuários com avatar como string
    const usuariosComAvatarAntigo = await Usuario.find({
      avatar: { $type: 'string' }
    });
    
    console.log(`📊 Encontrados ${usuariosComAvatarAntigo.length} usuários com avatar antigo`);
    
    let migrados = 0;
    
    for (const usuario of usuariosComAvatarAntigo) {
      try {
        // Migrar avatar usando o método do modelo
        usuario.migrarAvatarAntigo();
        await usuario.save();
        migrados++;
        console.log(`✅ Avatar migrado para usuário: ${usuario.nomeUsuario}`);
      } catch (erro) {
        console.error(`❌ Erro ao migrar avatar do usuário ${usuario.nomeUsuario}:`, erro.message);
      }
    }
    
    console.log(`🎉 Migração concluída! ${migrados} avatares migrados com sucesso`);
    
  } catch (erro) {
    console.error('❌ Erro durante a migração:', erro);
  }
}

// Função principal
async function executarMigracao() {
  console.log('🗡️ LIBRARIUM - MIGRAÇÃO DE AVATARES');
  console.log('=====================================');
  
  await conectarBanco();
  await migrarAvatares();
  
  console.log('✅ Migração finalizada!');
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  executarMigracao();
}

module.exports = { migrarAvatares };
