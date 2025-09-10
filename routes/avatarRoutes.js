const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const avatarController = require('../controllers/avatarController');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(autenticarUsuario);

// ===== EVOLUÇÃO DO AVATAR =====
router.post('/evolucao/verificar', avatarController.verificarEvolucao);

// ===== ESTATÍSTICAS =====
router.get('/estatisticas', avatarController.obterEstatisticas);

// ===== TEMA VISUAL =====
router.get('/tema', avatarController.obterTema);

// ===== PROGRESSO =====
router.get('/progresso', avatarController.obterProgresso);

// ===== HISTÓRICO =====
router.get('/historico', avatarController.obterHistorico);

// ===== DESBLOQUEIOS =====
router.get('/proximos-desbloqueios', avatarController.obterProximosDesbloqueios);

module.exports = router;
