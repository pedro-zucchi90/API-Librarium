const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const achievementController = require('../controllers/achievementController');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(autenticarUsuario);

// ===== LISTAGEM =====
router.get('/', achievementController.listar);

// ===== VERIFICAÇÃO =====
router.post('/verificar', achievementController.verificar);

// ===== ESTATÍSTICAS =====
router.get('/estatisticas', achievementController.estatisticas);

// ===== PERSONALIZADAS =====
router.post('/personalizada', achievementController.criarPersonalizada);

// ===== LEITURA =====
router.put('/:id/ler', achievementController.marcarComoLida);

// ===== FILTROS =====
router.get('/categoria/:categoria', achievementController.porCategoria);
router.get('/raridade/:raridade', achievementController.porRaridade);

// ===== PROGRESSO =====
router.get('/progresso', achievementController.progresso);

// ===== PRÓXIMAS =====
router.get('/proximas', achievementController.proximas);

module.exports = router;
