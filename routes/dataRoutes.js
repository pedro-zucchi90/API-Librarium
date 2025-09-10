const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const dataController = require('../controllers/dataController');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(autenticarUsuario);

// ===== EXPORTAÇÃO DE DADOS =====
router.get('/exportar/json', dataController.exportarJson);
router.get('/exportar/xml', dataController.exportarXml);
router.get('/exportar/zip', dataController.exportarZip);


// ===== IMPORTAÇÃO DE DADOS =====
router.post('/importar', dataController.importar);


// ===== BACKUP E RESTAURAÇÃO =====
router.post('/backup', dataController.backup);
router.get('/backups', dataController.listarBackups);


// ===== ESTATÍSTICAS DE EXPORTAÇÃO =====
router.get('/estatisticas', dataController.estatisticas);


// ===== VALIDAÇÃO DE DADOS =====
router.post('/validar', dataController.validar);


// ===== LIMPEZA DE DADOS =====
router.delete('/limpar', dataController.limpar);


// ===== SINCRONIZAÇÃO =====
router.post('/sincronizar', dataController.sincronizar);


// ===== CONFIGURAÇÕES =====
router.get('/configuracoes', dataController.obterConfiguracoes);
router.put('/configuracoes', dataController.atualizarConfiguracoes);

module.exports = router;
