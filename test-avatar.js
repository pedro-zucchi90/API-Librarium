#!/usr/bin/env node

/**
 * 🎭 Teste do Sistema de Avatar Evolutivo - Librarium
 * 
 * Este arquivo demonstra as funcionalidades do sistema de avatar
 * sem precisar do servidor completo rodando.
 */

const mongoose = require('mongoose');
const AvatarService = require('./services/avatarService');
const AchievementService = require('./services/achievementService');

// Configuração do MongoDB (conecte ao seu banco)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/librarium';

async function testarSistemaAvatar() {
  try {
    console.log('🎭 Iniciando teste do Sistema de Avatar Evolutivo...\n');

    // Conectar ao banco
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Buscar um usuário para teste
    const Usuario = require('./models/User');
    const usuario = await Usuario.findOne({});
    
    if (!usuario) {
      console.log('❌ Nenhum usuário encontrado. Crie um usuário primeiro.');
      return;
    }

    // Migrar avatar antigo se necessário
    if (typeof usuario.avatar === 'string') {
      console.log('🔄 Migrando avatar antigo para novo formato...');
      usuario.migrarAvatarAntigo();
      await usuario.save();
      console.log('✅ Avatar migrado com sucesso!\n');
    }

    console.log(`👤 Usuário de teste: ${usuario.nomeUsuario}`);
    console.log(`📊 Nível atual: ${usuario.nivel}`);
    console.log(`⭐ XP total: ${usuario.experiencia}`);
    console.log(`🎭 Avatar atual: ${usuario.avatar.tipo}\n`);

    // Testar verificação de evolução do avatar
    console.log('🔄 Testando verificação de evolução do avatar...');
    const resultadoEvolucao = await AvatarService.verificarEvolucaoAvatar(usuario._id);
    
    if (resultadoEvolucao && resultadoEvolucao.evolucoesAplicadas.length > 0) {
      console.log('🎉 Avatar evoluiu!');
      resultadoEvolucao.evolucoesAplicadas.forEach(evolucao => {
        console.log(`   - ${evolucao.descricao}`);
      });
    } else {
      console.log('ℹ️ Nenhuma evolução disponível no momento');
    }
    console.log('');

    // Testar verificação de conquistas
    console.log('🏆 Testando verificação de conquistas...');
    const conquistas = await AchievementService.verificarConquistas(usuario._id);
    
    if (conquistas && conquistas.length > 0) {
      console.log('🎉 Novas conquistas desbloqueadas!');
      conquistas.forEach(conquista => {
        console.log(`   - ${conquista.conquista.titulo} (+${conquista.xpGanho} XP)`);
      });
    } else {
      console.log('ℹ️ Nenhuma nova conquista disponível');
    }
    console.log('');

    // Obter estatísticas do avatar
    console.log('📊 Obtendo estatísticas do avatar...');
    const estatisticas = await AvatarService.obterEstatisticasAvatar(usuario._id);
    
    if (estatisticas) {
      console.log('🎭 Estatísticas do Avatar:');
      console.log(`   - Tipo: ${estatisticas.avatar.tipo}`);
      console.log(`   - Nível: ${estatisticas.avatar.nivel}/5`);
      console.log(`   - Evolução: ${estatisticas.avatar.evolucao}`);
      console.log(`   - Equipamentos desbloqueados: ${estatisticas.progresso.equipamentosDesbloqueados.total}/15`);
      
      if (estatisticas.progresso.proximaEvolucao) {
        console.log(`   - Próxima evolução: ${estatisticas.progresso.proximaEvolucao.nome} (${estatisticas.progresso.proximaEvolucao.requisito})`);
      }
    }
    console.log('');

    // Obter tema visual
    console.log('🎨 Obtendo tema visual...');
    const tema = AvatarService.obterTemaVisual(usuario.avatar);
    console.log('🎨 Tema Visual:');
    console.log(`   - Cor primária: ${tema.corPrimaria}`);
    console.log(`   - Cor secundária: ${tema.corSecundaria}`);
    console.log(`   - Cor destaque: ${tema.corDestaque}`);
    console.log(`   - Gradiente: ${tema.gradiente}`);
    console.log('');

    // Simular evolução forçada (para teste)
    console.log('🧪 Simulando evolução forçada...');
    usuario.experiencia += 1000; // Adicionar XP
    await usuario.save();
    
    // Verificar novamente
    const novaEvolucao = await AvatarService.verificarEvolucaoAvatar(usuario._id);
    if (novaEvolucao && novaEvolucao.evolucoesAplicadas.length > 0) {
      console.log('🎉 Nova evolução após simulação!');
      novaEvolucao.evolucoesAplicadas.forEach(evolucao => {
        console.log(`   - ${evolucao.descricao}`);
      });
    }
    console.log('');

    console.log('✅ Teste do Sistema de Avatar concluído com sucesso!');
    console.log('\n🎭 Funcionalidades testadas:');
    console.log('   ✅ Verificação automática de evolução');
    console.log('   ✅ Sistema de conquistas');
    console.log('   ✅ Estatísticas do avatar');
    console.log('   ✅ Temas visuais');
    console.log('   ✅ Simulação de evolução');

  } catch (erro) {
    console.error('❌ Erro durante o teste:', erro);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testarSistemaAvatar().catch(console.error);
}

module.exports = { testarSistemaAvatar };
