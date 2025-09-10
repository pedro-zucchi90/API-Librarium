const logger = require('../utils/logger');

// Middleware para tratar rotas não encontradas
const notFoundHandler = (req, res) => {
  res.status(404).json({
    erro: 'Caminho não encontrado',
    mensagem: '🌑 Este caminho não existe no Librarium...',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

// Middleware global para tratamento de erros
const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error('Erro na aplicação:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determinar tipo de erro
  let statusCode = 500;
  let mensagem = '💀 Algo deu errado nas sombras...';
  let detalhes = null;

  // Erros de validação do Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    mensagem = '🌑 Dados inválidos fornecidos';
    detalhes = Object.values(err.errors).map(e => e.message);
  }

  // Erros de cast do MongoDB (IDs inválidos)
  else if (err.name === 'CastError') {
    statusCode = 400;
    mensagem = '🌑 ID inválido fornecido';
    detalhes = `Campo: ${err.path}, Valor: ${err.value}`;
  }

  // Erros de duplicação (unique constraint)
  else if (err.code === 11000) {
    statusCode = 409;
    mensagem = '🌑 Conflito: dados já existem';
    const campo = Object.keys(err.keyValue)[0];
    detalhes = `Campo '${campo}' já está em uso`;
  }

  // Erros de JWT
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    mensagem = '🗡️ Token inválido';
  }

  // Erros de expiração do JWT
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    mensagem = '🗡️ Token expirado';
  }

  // Erros de sintaxe JSON
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    mensagem = '🌑 JSON inválido fornecido';
  }

  // Erros de limite de arquivo
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    mensagem = '🌑 Arquivo muito grande';
    detalhes = `Tamanho máximo permitido: ${process.env.MAX_FILE_SIZE || '10MB'}`;
  }

  // Erros de rate limiting
  else if (err.status === 429) {
    statusCode = 429;
    mensagem = '🌑 Muitas requisições';
    detalhes = 'Tente novamente mais tarde';
  }

  // Erros de autenticação
  else if (err.status === 401) {
    statusCode = 401;
    mensagem = '⚔️ Acesso negado';
  }

  // Erros de autorização
  else if (err.status === 403) {
    statusCode = 403;
    mensagem = '⚔️ Permissão negada';
  }

  // Erros de não encontrado
  else if (err.status === 404) {
    statusCode = 404;
    mensagem = '🌑 Recurso não encontrado';
  }

  // Erros de conflito
  else if (err.status === 409) {
    statusCode = 409;
    mensagem = '⚔️ Conflito de dados';
  }

  // Erros de validação personalizados
  else if (err.status && err.status >= 400 && err.status < 500) {
    statusCode = err.status;
    mensagem = err.message || '🌑 Erro de validação';
  }

  // Resposta de erro
  const resposta = {
    erro: 'Erro interno do servidor',
    mensagem,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    resposta.detalhes = detalhes || err.message;
    resposta.stack = err.stack;
    resposta.tipo = err.name;
  }

  // Adicionar detalhes específicos se disponíveis
  if (detalhes) {
    resposta.detalhes = detalhes;
  }

  // Adicionar código de erro se disponível
  if (err.code) {
    resposta.codigo = err.code;
  }

  // Enviar resposta
  res.status(statusCode).json(resposta);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
