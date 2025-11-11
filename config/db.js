const mongoose = require('mongoose');

let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000; // 5 segundos

const conectarBancoDados = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/librarium';
    console.log('🔗 Tentando conectar ao MongoDB:', mongoUri);

    const conexao = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
      keepAlive: true,
      keepAliveInitialDelay: 30000, // Keep-alive inicial de 30 segundos
      maxPoolSize: 10, // Limitar pool de conexões
      minPoolSize: 2, // Manter pelo menos 2 conexões
    });

    console.log(`🔮 MongoDB conectado: ${conexao.connection.host}`);
    console.log('📚 O Librarium desperta das sombras...');
    
    // Resetar contador de tentativas quando conectar com sucesso
    reconnectAttempts = 0;
    isReconnecting = false;

    // Configurar eventos de conexão
    mongoose.connection.on('error', (erro) => {
      console.error('💀 Erro na conexão MongoDB:', erro.message);
      // Não fazer process.exit() - tentar reconectar
    });

    mongoose.connection.on('disconnected', async () => {
      console.log('🌑 MongoDB desconectado - tentando reconectar...');
      
      if (!isReconnecting) {
        isReconnecting = true;
        reconnectAttempts++;
        
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
          console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
        } else {
          console.log(`🔄 Tentativa de reconexão ${reconnectAttempts} (continuando tentativas...)`);
        }
        
        setTimeout(async () => {
          try {
            // Verificar se já está conectado antes de tentar conectar
            if (mongoose.connection.readyState === 1) {
              console.log('✅ MongoDB já está conectado!');
              reconnectAttempts = 0;
              isReconnecting = false;
              return;
            }
            
            await mongoose.connect(mongoUri, {
              useNewUrlParser: true,
              useUnifiedTopology: true,
              serverSelectionTimeoutMS: 5000,
              socketTimeoutMS: 45000,
              keepAlive: true,
              keepAliveInitialDelay: 30000,
              maxPoolSize: 10,
              minPoolSize: 2,
            });
            console.log('✅ MongoDB reconectado com sucesso!');
            reconnectAttempts = 0;
            isReconnecting = false;
          } catch (erro) {
            console.error(`❌ Falha na tentativa ${reconnectAttempts} de reconexão:`, erro.message);
            isReconnecting = false;
            
            // Tentar novamente mesmo após MAX_RECONNECT_ATTEMPTS
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
              console.log('🔄 Continuando tentativas de reconexão...');
              // Resetar flag para permitir nova tentativa
              setTimeout(() => {
                isReconnecting = false;
              }, RECONNECT_DELAY);
            }
          }
        }, RECONNECT_DELAY);
      }
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconectado!');
      reconnectAttempts = 0;
      isReconnecting = false;
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB conectado!');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🗡️ Conexão MongoDB fechada devido ao encerramento da aplicação');
      process.exit(0);
    });
  } catch (erro) {
    console.error('💥 Erro ao conectar ao MongoDB:', erro.message);
    // Não fazer process.exit(1) imediatamente - tentar reconectar
    console.log('🔄 Tentando reconectar em 5 segundos...');
    
    setTimeout(async () => {
      try {
        await conectarBancoDados();
      } catch (e) {
        console.error('💥 Falha na reconexão inicial:', e.message);
        process.exit(1);
      }
    }, RECONNECT_DELAY);
  }
};

module.exports = conectarBancoDados;
