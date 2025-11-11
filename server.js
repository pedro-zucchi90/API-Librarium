require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar configurações
const conectarBancoDados = require('./config/db');
const logger = require('./utils/logger');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const habitRoutes = require('./routes/habitRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const multiplayerRoutes = require('./routes/multiplayerRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const dataRoutes = require('./routes/dataRoutes');
const avatarRoutes = require('./routes/avatarRoutes');

// Importar serviços
const AchievementService = require('./services/achievementService');
const AvatarService = require('./services/avatarService');

// Importar middlewares
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { 
  validationLogger, 
  performanceLogger, 
  databaseLogger, 
  authLogger, 
  rateLimitLogger, 
  securityLogger, 
  validationErrorLogger 
} = require('./middleware/debugMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIGURAÇÕES DE SEGURANÇA =====

// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'', 'https://accounts.google.com', 'https://oauth2.googleapis.com'],
      frameSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : true),
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limite por IP (aumentado para testes)
  message: {
    erro: 'Muitas requisições',
    mensagem: ' Muitas requisições deste IP, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      erro: 'Rate limit excedido',
      mensagem: ' Muitas requisições, tente novamente mais tarde',
      retryAfter: Math.ceil(process.env.RATE_LIMIT_WINDOW_MS / 1000)
    });
  }
});

app.use('/api/', limiter);

// ===== MIDDLEWARES =====

// Compressão gzip
app.use(compression());

// ===== LOGGING APRIMORADO =====

// ===== MIDDLEWARES DE DEBUG E LOGGING =====

// Middleware de logging de requisições detalhado
app.use(logger.requestMiddleware);

// Middlewares de debug adicionais
app.use(validationLogger);
app.use(databaseLogger);
app.use(authLogger);
app.use(rateLimitLogger);
app.use(securityLogger);
app.use(validationErrorLogger);

// Logging adicional com Morgan (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Favicon silencioso (evita 404 e logs indesejados)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ===== ROTAS =====

// Health check simplificado
app.get('/api/saude', (req, res) => {
  res.json({ 
    sucesso: true,
    mensagem: 'Librarium está funcionando',
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    funcionalidades: {
      autenticacao: true,
      habitos: true,
      conquistas: true,
      avatarEvolutivo: true,
      multiplayer: true,
      sistemaConquistas: false
    },
  });
});

// Servir arquivos estáticos de upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/habitos', habitRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/estatisticas', statsRoutes);
app.use('/api/multiplayer', multiplayerRoutes);
app.use('/api/integracao', integrationRoutes);
app.use('/api/conquistas', achievementRoutes);
app.use('/api/dados', dataRoutes);
app.use('/api/avatar', avatarRoutes);

// ===== SERVIÇOS DE FUNDO =====

// Inicializar serviços
async function inicializarServicos() {
  try {
    // Verificar conquistas automaticamente (a cada 5 minutos)
    setInterval(async () => {
      try {
        const usuarios = await require('./models/User').find({});
        for (const usuario of usuarios) {
          // Verificar conquistas
          await AchievementService.verificarConquistas(usuario._id);
          
          // Verificar evolução do avatar
          await AvatarService.verificarEvolucaoAvatar(usuario._id);
        }
      } catch (erro) {
        logger.error('Erro ao verificar conquistas e evolução automática:', erro);
      }
    }, 5 * 60 * 1000);

    // Limpeza automática de dados (a cada 24 horas)
    setInterval(async () => {
      try {
        logger.info('Iniciando limpeza automática de dados...');

        // Limpar conquistas antigas
        await AchievementService.limparConquistasAntigas(90);

        logger.info('Limpeza automática concluída');
      } catch (erro) {
        logger.error('Erro na limpeza automática:', erro);
      }
    }, 24 * 60 * 60 * 1000);

    logger.info('Serviços inicializados com sucesso');
  } catch (erro) {
    logger.error('Erro ao inicializar serviços:', erro);
  }
}

// ===== INICIALIZAÇÃO DO SERVIDOR =====

let server = null;

async function iniciarServidor() {
  try {
    // Conectar ao banco de dados
    await conectarBancoDados();

    // Inicializar serviços
    await inicializarServicos();

    // Iniciar servidor com configurações de keep-alive
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║                    🗡️ LIBRARIUM BACKEND                       ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log('║                                                              ║');
      console.log('║           ✅ Servidor rodando na porta ' + PORT + '                  ║');
      console.log('║           ✅ Banco de dados conectado                        ║');
      console.log('║           ✅ CRUD de Hábitos                                 ║');
      console.log('║           ✅ Sistema de Conquistas Avançado                  ║');
      console.log('║           ✅ Avatar Evolutivo Visual                         ║');
      console.log('║           ✅ Sistema de Equipamentos                         ║');
      console.log('║           ✅ Multiplayer                                     ║');
      console.log('║           ✅ Integrações Google                              ║');
      console.log('║           ✅ Exportação/Importação                           ║');
      console.log('║                                                              ║');
      console.log('║  🗡️ Health Check: http://localhost:' + PORT + '/api/saude             ║');
      console.log('║  📚 API Docs: http://localhost:' + PORT + '/api                      ║');
      console.log('║                                                              ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
    });

    // Configurar keep-alive e timeouts do servidor
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos (deve ser maior que keepAliveTimeout)
    
    // Tratamento de erros do servidor
    server.on('error', (erro) => {
      if (erro.code === 'EADDRINUSE') {
        console.error(`Porta ${PORT} já está em uso. Tente outra porta.`);
        process.exit(1);
      } else {
        logger.error('💥 Erro no servidor HTTP:', {
          error: erro.message,
          stack: erro.stack,
          timestamp: new Date().toISOString()
        });
        // Não fazer process.exit() - tentar reiniciar
        console.error('Erro no servidor, mas continuando...');
      }
    });

    // Health check interno periódico
    setInterval(() => {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        logger.warn('MongoDB não está conectado. Estado:', mongoose.connection.readyState);
      }
    }, 30000); // Verificar a cada 30 segundos

  } catch (erro) {
    logger.error('Erro ao iniciar servidor:', {
      error: erro.message,
      stack: erro.stack,
      timestamp: new Date().toISOString()
    });
    console.error('Erro ao iniciar servidor:', erro);
    // Não fazer process.exit(1) imediatamente - tentar reiniciar
    console.log('Tentando reiniciar servidor em 10 segundos...');
    setTimeout(() => {
      iniciarServidor().catch((e) => {
        console.error('Falha ao reiniciar servidor:', e);
        process.exit(1);
      });
    }, 10000);
  }
}

// ===== TRATAMENTO DE ERROS NÃO CAPTURADOS =====

// Prevenir que erros não capturados façam o servidor crashar
process.on('uncaughtException', (erro) => {
  logger.error('Erro não capturado (uncaughtException):', {
    error: erro.message,
    stack: erro.stack,
    timestamp: new Date().toISOString()
  });
  
  // Não fazer process.exit() - deixar o servidor continuar rodando
  // Apenas logar o erro para não perder a conexão
  console.error('Erro não capturado, mas servidor continua rodando:', erro.message);
});

// Prevenir que promises rejeitadas façam o servidor crashar
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada (unhandledRejection):', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  // Não fazer process.exit() - deixar o servidor continuar rodando
  console.error('Promise rejeitada não tratada, mas servidor continua rodando:', reason);
});

// ===== TRATAMENTO DE SINAIS =====

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Recebido ${signal}, encerrando servidor graciosamente...`);
  
  try {
    // Parar de aceitar novas conexões
    if (server) {
      server.close(() => {
        console.log('Servidor HTTP fechado');
      });
      
      // Forçar fechamento após 10 segundos se não fechar graciosamente
      setTimeout(() => {
        console.error('Forçando fechamento do servidor...');
        process.exit(1);
      }, 10000);
    }
    
    // Fechar conexões do banco
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Conexão MongoDB fechada');
    }
    
    process.exit(0);
  } catch (erro) {
    console.error('Erro durante shutdown:', erro);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== INICIAR SERVIDOR =====

iniciarServidor();

// ===== MIDDLEWARES DE ERRO APRIMORADOS =====

// Middleware de erro global aprimorado
app.use(logger.errorMiddleware);

// Middleware de erro original (como fallback)
app.use(errorHandler);

// Middleware para rotas não encontradas (deve ser o último)
app.use(notFoundHandler);