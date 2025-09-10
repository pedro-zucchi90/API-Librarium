const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const integrationController = require('../controllers/integrationController');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(autenticarUsuario);


// Iniciar processo de autorização OAuth2
router.get('/google/oauth', integrationController.iniciarGoogleOAuth);
// Callback OAuth2 - trocar código por token
router.get('/google/oauth/callback', integrationController.googleOAuthCallback);
// Sincronizar hábitos com Google Calendar
router.post('/google-calendar/sync', integrationController.syncGoogleCalendar);
// Obter eventos do Google Calendar
router.get('/google-calendar/eventos', integrationController.listarEventosGoogle);
// Sincronizar dados de saúde
router.post('/health/sync', integrationController.syncHealth);
// Obter dados de saúde sincronizados
router.get('/health/dados', integrationController.obterDadosSaude);
// Obter status das integrações
router.get('/status', integrationController.status);
// Desconectar integração
router.delete('/google/desconectar', integrationController.desconectarGoogle);

module.exports = router;
