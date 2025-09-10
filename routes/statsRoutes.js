const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(autenticarUsuario);

// ===== SISTEMA =====
router.get('/sistema', statsController.sistema);

// ===== GRÁFICOS =====
router.get('/grafico-semanal', statsController.graficoSemanal);

// ===== CATEGORIAS =====
router.get('/categorias', statsController.categorias);

// ===== HEATMAP =====
router.get('/heatmap', statsController.heatmap);

// ===== COMPARATIVO =====
router.get('/comparativo-mensal', statsController.comparativoMensal);

module.exports = router;
