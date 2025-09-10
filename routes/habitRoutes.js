const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const habitController = require('../controllers/habitController');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(autenticarUsuario);

// ===== LISTAGEM =====
router.get('/', habitController.listar);

// ===== DETALHES =====
router.get('/:id', habitController.obter);

// ===== CRIAÇÃO =====
router.post('/', habitController.criar);

// ===== ATUALIZAÇÃO =====
router.put('/:id', habitController.atualizar);

// ===== EXCLUSÃO =====
router.delete('/:id', habitController.deletar);

// ===== PROGRESSO =====
router.post('/:id/concluir', habitController.concluir);
router.get('/:id/progresso', habitController.obterProgresso);

module.exports = router;
