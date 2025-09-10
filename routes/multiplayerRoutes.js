const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const multiplayerController = require('../controllers/multiplayerController');

const router = express.Router();

router.use(autenticarUsuario);

// ===== SISTEMA DE BATALHAS =====
router.post('/batalha/criar', multiplayerController.criarBatalha);
router.post('/batalha/:id/aceitar', multiplayerController.aceitarBatalha);
router.post('/batalha/:id/finalizar', multiplayerController.finalizarBatalha);
router.get('/batalha', multiplayerController.listarBatalhas);

// ===== SISTEMA DE DESAFIOS =====
router.post('/desafio', multiplayerController.criarDesafio);
router.post('/desafio/:id/responder', multiplayerController.responderDesafio);
router.get('/desafio', multiplayerController.listarDesafios);

// ===== SISTEMA DE MENSAGENS =====
router.post('/mensagem', multiplayerController.enviarMensagem);
router.get('/mensagem/conversa/:usuarioId', multiplayerController.obterConversa);
router.put('/mensagem/:id/ler', multiplayerController.lerMensagem);
router.get('/mensagem/nao-lidas', multiplayerController.mensagensNaoLidas);

// ===== ENDPOINTS ADICIONAIS =====
router.get('/ranking', multiplayerController.ranking);
router.get('/estatisticas', multiplayerController.estatisticas);

module.exports = router;
