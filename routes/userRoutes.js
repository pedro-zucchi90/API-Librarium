const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(autenticarUsuario);

// ===== AVATAR =====
router.put('/avatar/evoluir', async (req, res) => userController.evoluirAvatar(req, res));
router.put('/avatar/customizar', async (req, res) => userController.customizarAvatar(req, res));

// ===== DADOS =====
router.get('/exportar', async (req, res) => userController.exportar(req, res));
router.post('/importar', async (req, res) => userController.importar(req, res));

// ===== DASHBOARD =====
router.get('/dashboard', async (req, res) => userController.dashboard(req, res));

// ===== ESTATÍSTICAS =====
router.get('/estatisticas', async (req, res) => userController.estatisticas(req, res));

// ===== RANKING =====
router.get('/ranking', async (req, res) => userController.ranking(req, res));

// ===== CONQUISTAS =====
router.get('/conquistas', async (req, res) => userController.conquistas(req, res));

// ===== PREFERÊNCIAS =====
router.put('/preferencias', async (req, res) => userController.atualizarPreferencias(req, res));

// ===== XP =====
router.post('/adicionar-xp', async (req, res) => userController.adicionarXP(req, res));

// ===== FOTO DE PERFIL =====
router.post('/foto-perfil', upload.single('foto'), handleMulterError, async (req, res) => userController.uploadFotoPerfil(req, res));
router.delete('/foto-perfil', async (req, res) => userController.removerFotoPerfil(req, res));

module.exports = router;
