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

// Formato para console (tema dark fantasy)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const levelIcons = {
      error: '☠️',
      warn: '⚠️',
      info: '☽',
      http: '🜲',
      verbose: '✧',
      debug: '🔮'
    };

    const glyphLeft = '⟬';
    const glyphRight = '⟭';
    const icon = levelIcons[level] || '✦';

    let head = `${glyphLeft} ${timestamp} ${glyphRight}`;
    let log = `${head} ${icon} ${level}: ${message}`;

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

logger.security = (message, meta = {}) => {
  logger.warn(`🛡️ ${message}`, { ...meta, type: 'security' });
};

logger.performance = (message, meta = {}) => {
  logger.info(`⚡ ${message}`, { ...meta, type: 'performance' });
};

// ===== NOVOS MÉTODOS DE DEBUG =====

logger.debugLog = (message, meta = {}) => {
  logger.debug(`🔍 ${message}`, { ...meta, type: 'debug' });
};

logger.request = (message, meta = {}) => {
  logger.info(`📥 ${message}`, { ...meta, type: 'request' });
};

logger.response = (message, meta = {}) => {
  logger.info(`📤 ${message}`, { ...meta, type: 'response' });
};

logger.errorLog = (message, meta = {}) => {
  logger.error(`❌ ${message}`, { ...meta, type: 'error' });
};

logger.validation = (message, meta = {}) => {
  logger.warn(`✅ ${message}`, { ...meta, type: 'validation' });
};

logger.business = (message, meta = {}) => {
  logger.info(`💼 ${message}`, { ...meta, type: 'business' });
};

logger.external = (message, meta = {}) => {
  logger.info(`🌐 ${message}`, { ...meta, type: 'external' });
};

logger.cache = (message, meta = {}) => {
  logger.info(`💾 ${message}`, { ...meta, type: 'cache' });
};

logger.middleware = (message, meta = {}) => {
  logger.info(`🔧 ${message}`, { ...meta, type: 'middleware' });
};

// Middleware para Express - Versão Aprimorada
logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Adicionar ID único à requisição
  req.requestId = requestId;

  // Ignorar completamente favicon.ico (sem log e com resposta silenciosa)
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).end();
    return;
  }

  // Log detalhado da requisição
  const requestData = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? 'Bearer ***' : 'none',
      'accept': req.get('Accept')
    },
    query: req.query,
    params: req.params,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : null,
    timestamp: new Date().toISOString()
  };

  logger.request(`Incoming Request`, requestData);

  // Interceptar resposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    const responseData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?._id,
      responseSize: res.get('Content-Length') || 'unknown',
      timestamp: new Date().toISOString()
    };

    // Log de performance se demorar muito
    if (duration > 1000) {
      logger.performance(`Slow Request Detected`, {
        ...responseData,
        performance: 'slow'
      });
    }

    logger.response(`Request Completed`, responseData);
  });

  next();
};

// Função para sanitizar dados sensíveis do body
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'senha', 'token', 'secret', 'key', 'authorization'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  }
  
  return sanitized;
}

// Middleware de tratamento de erros aprimorado
logger.errorMiddleware = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  // Log detalhado do erro
  const errorData = {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500,
      code: err.code,
      details: err.details
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent')
    },
    timestamp: new Date().toISOString()
  };

  // Log baseado no tipo de erro
  if (err.name === 'ValidationError') {
    logger.validation(`Validation Error`, errorData);
  } else if (err.name === 'CastError') {
    logger.validation(`Cast Error`, errorData);
  } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    logger.database(`Database Error`, errorData);
  } else if (err.statusCode === 401) {
    logger.auth(`Authentication Error`, errorData);
  } else if (err.statusCode === 403) {
    logger.security(`Authorization Error`, errorData);
  } else if (err.statusCode >= 400 && err.statusCode < 500) {
    logger.validation(`Client Error`, errorData);
  } else {
    logger.error(`Server Error`, errorData);
  }

  // Verificar se a resposta já foi enviada
  if (res.headersSent) {
    // Se a resposta já foi enviada, apenas logar e não tentar enviar novamente
    logger.error('Tentativa de enviar resposta após headers já enviados no errorMiddleware:', {
      url: req.originalUrl,
      method: req.method,
      requestId
    });
    return;
  }

  // Resposta padronizada
  const statusCode = err.statusCode || 500;
  const response = {
    sucesso: false,
    erro: err.name || 'Erro interno do servidor',
    mensagem: err.message || 'Ocorreu um erro inesperado',
    requestId,
    timestamp: new Date().toISOString()
  };

  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details;
  }

  try {
    res.status(statusCode).json(response);
  } catch (sendError) {
    // Se houver erro ao enviar resposta, apenas logar
    logger.error('Erro ao enviar resposta de erro:', {
      originalError: err.message,
      sendError: sendError.message,
      requestId
    });
  }
};

// Função para log de operações de banco de dados
logger.dbOperation = (operation, collection, data = {}) => {
  logger.database(`Database Operation: ${operation}`, {
    collection,
    operation,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Função para log de validações
logger.validationResult = (isValid, field, value, rule) => {
  const level = isValid ? 'debug' : 'warn';
  logger[level](`Validation ${isValid ? 'Success' : 'Failed'}`, {
    field,
    value: typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value,
    rule,
    isValid,
    timestamp: new Date().toISOString()
  });
};

// Função para log de cache
logger.cacheOperation = (operation, key, hit = null, ttl = null) => {
  logger.cache(`Cache ${operation}`, {
    key,
    hit,
    ttl,
    operation,
    timestamp: new Date().toISOString()
  });
};

// Função para log de integrações externas
logger.externalApi = (service, operation, status, duration, data = {}) => {
  const level = status >= 400 ? 'error' : 'info';
  logger.external(`${service} API ${operation}`, {
    service,
    operation,
    status,
    duration: `${duration}ms`,
    ...data,
    timestamp: new Date().toISOString()
  });
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
