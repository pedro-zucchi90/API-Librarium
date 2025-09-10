const jwt = require('jsonwebtoken');

const gerarToken = (idUsuario) => {
  return jwt.sign(
    { idUsuario },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (erro) {
    throw new Error('Token inválido');
  }
};

const extrairTokenDoHeader = (authHeader) => {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

module.exports = {
  gerarToken,
  verificarToken,
  extrairTokenDoHeader
};
