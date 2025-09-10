const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuração de cores para console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'white'
};

winston.addColors(colors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `[${timestamp}] ${level}: ${message}`;

    if (meta.error && meta.stack) {
      log += `\n${meta.stack}`;
    }

    if (Object.keys(meta).length > 0 && !meta.stack) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Configuração dos transportes
const transports = [];

// Console (sempre ativo)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
);

// Arquivo de logs (apenas em produção ou quando especificado)
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
  const logFile = process.env.LOG_FILE || path.join(logDir, 'librarium.log');

  transports.push(
    new winston.transports.File({
      filename: logFile,
      format: logFormat,
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );

  // Arquivo de erros separado
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Adicionar métodos personalizados
logger.startup = (message, meta = {}) => {
  logger.info(`🚀 ${message}`, { ...meta, type: 'startup' });
};

logger.shutdown = (message, meta = {}) => {
  logger.info(`🔄 ${message}`, { ...meta, type: 'shutdown' });
};

logger.database = (message, meta = {}) => {
  logger.info(`🗄️ ${message}`, { ...meta, type: 'database' });
};

logger.auth = (message, meta = {}) => {
  logger.info(`🔐 ${message}`, { ...meta, type: 'auth' });
};

logger.habit = (message, meta = {}) => {
  logger.info(`⚔️ ${message}`, { ...meta, type: 'habit' });
};

logger.achievement = (message, meta = {}) => {
  logger.info(`🏆 ${message}`, { ...meta, type: 'achievement' });
};

logger.multiplayer = (message, meta = {}) => {
  logger.info(`🎮 ${message}`, { ...meta, type: 'multiplayer' });
};

logger.integration = (message, meta = {}) => {
  logger.info(`🔗 ${message}`, { ...meta, type: 'integration' });
};

logger.notification = (message, meta = {}) => {
  logger.info(`🔔 ${message}`, { ...meta, type: 'notification' });
};

logger.security = (message, meta = {}) => {
  logger.warn(`🛡️ ${message}`, { ...meta, type: 'security' });
};

logger.performance = (message, meta = {}) => {
  logger.info(`⚡ ${message}`, { ...meta, type: 'performance' });
};

// Middleware para Express
logger.middleware = (req, res, next) => {
  const start = Date.now();

  // Log da requisição
  logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    timestamp: new Date().toISOString()
  });

  // Interceptar resposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(level, `${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?._id,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// Função para limpar logs antigos
logger.cleanup = async (dias = 30) => {
  try {
    const logDir = path.join(__dirname, '../logs');
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const cutoff = now - (dias * 24 * 60 * 60 * 1000);

    let removed = 0;

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime.getTime() < cutoff) {
        fs.unlinkSync(filePath);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`🗑️ ${removed} arquivos de log antigos removidos`);
    }

    return removed;
  } catch (erro) {
    logger.error('Erro ao limpar logs antigos:', erro);
    return 0;
  }
};

// Função para obter estatísticas de logs
logger.getStats = () => {
  try {
    const logDir = path.join(__dirname, '../logs');
    const files = fs.readdirSync(logDir);

    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      files: []
    };

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const fileStats = fs.statSync(filePath);

      stats.totalSize += fileStats.size;
      stats.files.push({
        name: file,
        size: fileStats.size,
        modified: fileStats.mtime,
        created: fileStats.birthtime
      });
    }

    return stats;
  } catch (erro) {
    logger.error('Erro ao obter estatísticas de logs:', erro);
    return null;
  }
};

// Configurar limpeza automática (diariamente às 3h)
if (process.env.NODE_ENV === 'production') {
  const cron = require('node-cron');
  cron.schedule('0 3 * * *', () => {
    logger.cleanup(30); // Manter logs de 30 dias
  });
}

module.exports = logger;
