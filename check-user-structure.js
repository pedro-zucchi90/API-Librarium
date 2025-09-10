#!/usr/bin/env node

/**
 * 🔍 Script para Verificar Estrutura dos Usuários - Librarium
 * 
 * Este script verifica a estrutura atual dos usuários no banco
 * para entender como fazer a migração corretamente.
 */

const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/librarium';

async function verificarEstrutura() {
  try {
    console.log('🔍 Verificando estrutura dos usuários...\n');

    // Conectar ao banco
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Acessar a coleção diretamente
    const db = mongoose.connection.db;
    const collection = db.collection('usuarios');

    // Buscar um usuário para análise
    const usuario = await collection.findOne({});
    
    if (!usuario) {
      console.log('❌ Nenhum usuário encontrado.');
      return;
    }

    console.log('📋 Estrutura do usuário encontrado:');
    console.log(`   ID: ${usuario._id}`);
    console.log(`   Nome: ${usuario.nomeUsuario || 'N/A'}`);
    console.log(`   Email: ${usuario.email || 'N/A'}`);
    console.log(`   Avatar: ${JSON.stringify(usuario.avatar, null, 2)}`);
    
    if (usuario.personalizacaoAvatar) {
      console.log(`   Personalização: ${JSON.stringify(usuario.personalizacaoAvatar, null, 2)}`);
    } else {
      console.log('   Personalização: undefined');
    }

    // Verificar tipos dos campos
    console.log('\n🔍 Análise dos tipos:');
    console.log(`   Avatar tipo: ${typeof usuario.avatar}`);
    if (usuario.personalizacaoAvatar) {
      console.log(`   Personalização tipo: ${typeof usuario.personalizacaoAvatar}`);
      if (usuario.personalizacaoAvatar.acessorio) {
        console.log(`   Acessório tipo: ${typeof usuario.personalizacaoAvatar.acessorio}`);
      }
    }

  } catch (erro) {
    console.error('❌ Erro durante verificação:', erro);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

// Executar verificação se chamado diretamente
if (require.main === module) {
  verificarEstrutura().catch(console.error);
}

module.exports = { verificarEstrutura };
