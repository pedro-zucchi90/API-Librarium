const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// ===== AUTENTICAÇÃO =====
router.post('/registrar', authController.registrar);
router.post('/login', authController.login);

// ===== PERFIL =====
router.get('/perfil', autenticarUsuario, authController.obterPerfil);
router.put('/perfil', autenticarUsuario, authController.atualizarPerfil);

// ===== VALIDAÇÃO =====
router.get('/verificar', autenticarUsuario, authController.verificarToken);

module.exports = router;
