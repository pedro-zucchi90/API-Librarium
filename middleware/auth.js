const { verificarToken, extrairTokenDoHeader } = require('../config/jwt');
const Usuario = require('../models/User');

const autenticarUsuario = async (req, res, next) => {
  try {
    const token = extrairTokenDoHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        erro: 'Acesso negado',
        mensagem: '🌑 Token de autenticação não fornecido'
      });
    }

    const decoded = verificarToken(token);
    const usuario = await Usuario.findById(decoded.idUsuario).select('-senha');

    if (!usuario) {
      return res.status(401).json({
        erro: 'Usuário não encontrado',
        mensagem: '👻 Este caçador não existe no Librarium'
      });
    }

    // Atualizar última atividade
    await usuario.atualizarUltimaAtividade();

    req.usuario = usuario;
    next();
  } catch (erro) {
    console.error('Erro na autenticação:', erro);
    res.status(401).json({
      erro: 'Token inválido',
      mensagem: '🗡️ Suas credenciais expiraram, faça login novamente'
    });
  }
};

const verificarPropriedade = (req, res, next) => {
  if (req.params.idUsuario && req.params.idUsuario !== req.usuario._id.toString()) {
    return res.status(403).json({
      erro: 'Acesso proibido',
      mensagem: '⚔️ Você não tem permissão para acessar recursos de outro caçador'
    });
  }
  next();
};

module.exports = {
  autenticarUsuario,
  verificarPropriedade
};
