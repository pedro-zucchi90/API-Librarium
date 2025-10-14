/**
 * 🔍 Middleware de Debug - Librarium API
 * 
 * Middlewares adicionais para logging detalhado e debug
 */

const logger = require('../utils/logger');

/**
 * Middleware para log de validações de entrada
 */
const validationLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_VALIDATION === 'true') {
    const requestId = req.requestId;
    
    // Log de parâmetros da URL
    if (req.params && Object.keys(req.params).length > 0) {
      logger.debugLog('Request Parameters', {
        requestId,
        params: req.params
      });
    }
    
    // Log de query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      logger.debugLog('Query Parameters', {
        requestId,
        query: req.query
      });
    }
    
    // Log de body (sanitizado)
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = sanitizeBody(req.body);
      logger.debugLog('Request Body', {
        requestId,
        body: sanitizedBody
      });
    }
  }
  
  next();
};

/**
 * Middleware para log de performance de operações específicas
 */
const performanceLogger = (operationName) => {
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.requestId;
    
    // Interceptar o fim da resposta
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.performance(`${operationName} Completed`, {
        requestId,
        operation: operationName,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?._id
      });
      
      // Alertar se a operação demorar muito
      if (duration > 2000) {
        logger.performance(`${operationName} - Slow Operation Alert`, {
          requestId,
          duration: `${duration}ms`,
          threshold: '2000ms',
          severity: 'warning'
        });
      }
    });
    
    next();
  };
};

/**
 * Middleware para log de operações de banco de dados
 */
const databaseLogger = (req, res, next) => {
  const originalSend = res.send;
  const requestId = req.requestId;
  
  // Contador de operações de banco
  req.dbOperations = {
    count: 0,
    operations: []
  };
  
  // Interceptar resposta para log final
  res.send = function(data) {
    if (req.dbOperations.count > 0) {
      logger.performance('Database Operations Summary', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        totalOperations: req.dbOperations.count,
        operations: req.dbOperations.operations,
        userId: req.user?._id
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware para log de autenticação
 */
const authLogger = (req, res, next) => {
  const requestId = req.requestId;
  
  if (req.user) {
    logger.auth('Authenticated Request', {
      requestId,
      userId: req.user._id,
      email: req.user.email,
      nivel: req.user.nivel,
      experiencia: req.user.experiencia,
      method: req.method,
      url: req.originalUrl
    });
  } else {
    logger.auth('Unauthenticated Request', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
};

/**
 * Middleware para log de rate limiting
 */
const rateLimitLogger = (req, res, next) => {
  const requestId = req.requestId;
  
  // Log de rate limiting se aplicado
  if (res.get('X-RateLimit-Limit')) {
    logger.security('Rate Limit Applied', {
      requestId,
      limit: res.get('X-RateLimit-Limit'),
      remaining: res.get('X-RateLimit-Remaining'),
      reset: res.get('X-RateLimit-Reset'),
      ip: req.ip,
      method: req.method,
      url: req.originalUrl
    });
  }
  
  next();
};

/**
 * Middleware para log de headers suspeitos
 */
const securityLogger = (req, res, next) => {
  const requestId = req.requestId;
  const suspiciousHeaders = [];
  
  // Verificar headers suspeitos
  const headers = req.headers;
  
  // X-Forwarded-For com múltiplos IPs
  if (headers['x-forwarded-for'] && headers['x-forwarded-for'].includes(',')) {
    suspiciousHeaders.push('multiple-x-forwarded-for');
  }
  
  // User-Agent suspeito
  if (headers['user-agent'] && (
    headers['user-agent'].includes('bot') ||
    headers['user-agent'].includes('crawler') ||
    headers['user-agent'].includes('scanner')
  )) {
    suspiciousHeaders.push('suspicious-user-agent');
  }
  
  // Content-Type inválido
  if (req.method === 'POST' && !headers['content-type']) {
    suspiciousHeaders.push('missing-content-type');
  }
  
  if (suspiciousHeaders.length > 0) {
    logger.security('Suspicious Request Detected', {
      requestId,
      ip: req.ip,
      userAgent: headers['user-agent'],
      method: req.method,
      url: req.originalUrl,
      suspiciousHeaders,
      allHeaders: headers
    });
  }
  
  next();
};

/**
 * Middleware para log de erros de validação específicos
 */
const validationErrorLogger = (req, res, next) => {
  const originalJson = res.json;
  const requestId = req.requestId;
  
  res.json = function(data) {
    // Log de erros de validação
    if (data && data.erro && res.statusCode >= 400 && res.statusCode < 500) {
      logger.validation('Validation Error Response', {
        requestId,
        statusCode: res.statusCode,
        error: data.erro,
        message: data.mensagem,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?._id,
        body: sanitizeBody(req.body),
        query: req.query,
        params: req.params
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Função para sanitizar dados sensíveis
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = [
    'password', 'senha', 'token', 'secret', 'key', 'authorization',
    'refreshToken', 'accessToken', 'apiKey', 'privateKey'
  ];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  }
  
  return sanitized;
}

/**
 * Middleware para log de integrações externas
 */
const integrationLogger = (serviceName) => {
  return (req, res, next) => {
    const requestId = req.requestId;
    const startTime = Date.now();
    
    logger.integration(`${serviceName} Integration Request`, {
      requestId,
      service: serviceName,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?._id
    });
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.integration(`${serviceName} Integration Response`, {
        requestId,
        service: serviceName,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        success: res.statusCode < 400
      });
    });
    
    next();
  };
};

/**
 * Middleware para log de operações de negócio
 */
const businessLogger = (operationName) => {
  return (req, res, next) => {
    const requestId = req.requestId;
    
    logger.business(`${operationName} Started`, {
      requestId,
      operation: operationName,
      userId: req.user?._id,
      method: req.method,
      url: req.originalUrl
    });
    
    next();
  };
};

module.exports = {
  validationLogger,
  performanceLogger,
  databaseLogger,
  authLogger,
  rateLimitLogger,
  securityLogger,
  validationErrorLogger,
  integrationLogger,
  businessLogger,
  sanitizeBody
};
