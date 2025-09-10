const mongoose = require('mongoose');

const conectarBancoDados = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/librarium';
    console.log('🔗 Tentando conectar ao MongoDB:', mongoUri);

    const conexao = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`🔮 MongoDB conectado: ${conexao.connection.host}`);
    console.log('📚 O Librarium desperta das sombras...');

    // Configurar eventos de conexão
    mongoose.connection.on('error', (erro) => {
      console.error('💀 Erro na conexão MongoDB:', erro);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🌑 MongoDB desconectado');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🗡️ Conexão MongoDB fechada devido ao encerramento da aplicação');
      process.exit(0);
    });
  } catch (erro) {
    console.error('💥 Erro ao conectar ao MongoDB:', erro.message);
    process.exit(1);
  }
};

module.exports = conectarBancoDados;
