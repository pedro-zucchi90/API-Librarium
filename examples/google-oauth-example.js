/**
 * 🎨 Exemplo de Uso - Google OAuth no Librarium
 * 
 * Este arquivo contém exemplos práticos de como implementar
 * e usar o Google OAuth no projeto
 */

const axios = require('axios');

// ===== 1. CONFIGURAÇÃO BÁSICA =====

/**
 * Configurações do Google OAuth
 */
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  scope: 'email profile',
  authUrl: 'https://accounts.google.com/oauth/authorize',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

// ===== 2. GERAR URL DE AUTORIZAÇÃO =====

/**
 * Gera URL de autorização para o usuário
 * @param {string} state - Estado para segurança (opcional)
 * @returns {string} URL de autorização
 */
function gerarUrlAutorizacao(state = null) {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    scope: googleConfig.scope,
    response_type: 'code',
    access_type: 'offline'
  });

  if (state) {
    params.append('state', state);
  }

  return `${googleConfig.authUrl}?${params.toString()}`;
}

// ===== 3. TROCAR CÓDIGO POR TOKEN =====

/**
 * Troca o código de autorização por um token de acesso
 * @param {string} code - Código retornado pelo Google
 * @returns {Promise<Object>} Token e informações do usuário
 */
async function trocarCodigoPorToken(code) {
  try {
    const response = await axios.post(googleConfig.tokenUrl, {
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: googleConfig.redirectUri
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Buscar informações do usuário
    const userInfo = await buscarInformacoesUsuario(access_token);

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      user: userInfo
    };

  } catch (error) {
    console.error('Erro ao trocar código por token:', error.response?.data || error.message);
    throw new Error('Falha na autenticação com Google');
  }
}

// ===== 4. BUSCAR INFORMAÇÕES DO USUÁRIO =====

/**
 * Busca informações do usuário usando o token de acesso
 * @param {string} accessToken - Token de acesso do Google
 * @returns {Promise<Object>} Informações do usuário
 */
async function buscarInformacoesUsuario(accessToken) {
  try {
    const response = await axios.get(googleConfig.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return {
      id: response.data.id,
      email: response.data.email,
      nome: response.data.name,
      foto: response.data.picture,
      verificado: response.data.verified_email
    };

  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error.response?.data || error.message);
    throw new Error('Falha ao obter informações do usuário');
  }
}

// ===== 5. REFRESCAR TOKEN =====

/**
 * Refresca um token de acesso expirado
 * @param {string} refreshToken - Token de refresh
 * @returns {Promise<Object>} Novo token de acesso
 */
async function refrescarToken(refreshToken) {
  try {
    const response = await axios.post(googleConfig.tokenUrl, {
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };

  } catch (error) {
    console.error('Erro ao refrescar token:', error.response?.data || error.message);
    throw new Error('Falha ao refrescar token');
  }
}

// ===== 6. EXEMPLO DE CONTROLLER EXPRESS =====

/**
 * Controller para lidar com OAuth do Google
 */
const googleAuthController = {
  /**
   * Inicia o processo de login com Google
   */
  iniciarLogin: (req, res) => {
    try {
      // Gerar estado para segurança
      const state = Math.random().toString(36).substring(7);
      
      // Armazenar estado na sessão (recomendado)
      req.session.oauthState = state;
      
      const authUrl = gerarUrlAutorizacao(state);
      
      res.json({
        sucesso: true,
        authUrl: authUrl,
        mensagem: 'Redirecione o usuário para esta URL'
      });
      
    } catch (error) {
      console.error('Erro ao iniciar login:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Não foi possível iniciar o login com Google'
      });
    }
  },

  /**
   * Processa o callback do Google OAuth
   */
  processarCallback: async (req, res) => {
    try {
      const { code, state } = req.query;
      
      // Verificar estado para segurança
      if (state && state !== req.session.oauthState) {
        return res.status(400).json({
          erro: 'Estado inválido',
          mensagem: 'Solicitação de autenticação inválida'
        });
      }

      if (!code) {
        return res.status(400).json({
          erro: 'Código não fornecido',
          mensagem: 'Código de autorização não foi fornecido'
        });
      }

      // Trocar código por token
      const tokenData = await trocarCodigoPorToken(code);
      
      // Aqui você pode:
      // 1. Criar ou buscar usuário no banco de dados
      // 2. Gerar JWT próprio para o usuário
      // 3. Armazenar tokens do Google (opcional)
      
      res.json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso!',
        usuario: tokenData.user,
        token: tokenData.accessToken // Ou seu JWT próprio
      });

    } catch (error) {
      console.error('Erro no callback do Google:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha na autenticação com Google'
      });
    }
  },

  /**
   * Busca informações do usuário logado
   */
  buscarUsuario: async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        return res.status(401).json({
          erro: 'Token não fornecido',
          mensagem: 'Token de acesso é obrigatório'
        });
      }

      const userInfo = await buscarInformacoesUsuario(accessToken);
      
      res.json({
        sucesso: true,
        usuario: userInfo
      });

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(401).json({
        erro: 'Token inválido',
        mensagem: 'Token de acesso inválido ou expirado'
      });
    }
  }
};

// ===== 7. EXEMPLO DE ROTAS EXPRESS =====

/**
 * Exemplo de como configurar as rotas
 */
const configurarRotasGoogle = (app) => {
  // Rota para iniciar login
  app.get('/api/auth/google', googleAuthController.iniciarLogin);
  
  // Rota de callback
  app.get('/api/auth/google/callback', googleAuthController.processarCallback);
  
  // Rota para buscar informações do usuário
  app.get('/api/auth/google/user', googleAuthController.buscarUsuario);
};

// ===== 8. EXEMPLO DE USO NO FRONTEND =====

/**
 * Exemplo de JavaScript para o frontend
 */
const exemploFrontend = `
// Função para iniciar login com Google
async function iniciarLoginGoogle() {
  try {
    const response = await fetch('/api/auth/google');
    const data = await response.json();
    
    if (data.sucesso) {
      // Redirecionar usuário para o Google
      window.location.href = data.authUrl;
    } else {
      console.error('Erro:', data.mensagem);
    }
  } catch (error) {
    console.error('Erro ao iniciar login:', error);
  }
}

// Função para buscar informações do usuário
async function buscarUsuarioGoogle(accessToken) {
  try {
    const response = await fetch('/api/auth/google/user', {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`
      }
    });
    
    const data = await response.json();
    
    if (data.sucesso) {
      console.log('Usuário:', data.usuario);
      return data.usuario;
    } else {
      console.error('Erro:', data.mensagem);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

// Botão de login com Google
document.getElementById('loginGoogle').addEventListener('click', iniciarLoginGoogle);
`;

// ===== 9. EXEMPLO DE INTEGRAÇÃO COM BANCO DE DADOS =====

/**
 * Exemplo de como integrar com o modelo User existente
 */
const integrarComUsuario = async (googleUser) => {
  try {
    const Usuario = require('../models/User');
    
    // Buscar usuário existente por email
    let usuario = await Usuario.findOne({ email: googleUser.email });
    
    if (usuario) {
      // Atualizar informações do Google
      usuario.googleId = googleUser.id;
      usuario.foto = googleUser.foto;
      usuario.verificado = googleUser.verificado;
      await usuario.save();
    } else {
      // Criar novo usuário
      usuario = new Usuario({
        nome: googleUser.nome,
        email: googleUser.email,
        googleId: googleUser.id,
        foto: googleUser.foto,
        verificado: googleUser.verificado,
        senha: null // Usuários do Google não têm senha
      });
      await usuario.save();
    }
    
    return usuario;
    
  } catch (error) {
    console.error('Erro ao integrar com usuário:', error);
    throw error;
  }
};

// ===== 10. VALIDAÇÃO DE CONFIGURAÇÃO =====

/**
 * Valida se as configurações do Google OAuth estão corretas
 */
function validarConfiguracao() {
  const errors = [];
  
  if (!googleConfig.clientId) {
    errors.push('GOOGLE_CLIENT_ID não configurado');
  }
  
  if (!googleConfig.clientSecret) {
    errors.push('GOOGLE_CLIENT_SECRET não configurado');
  }
  
  if (!googleConfig.redirectUri) {
    errors.push('GOOGLE_REDIRECT_URI não configurado');
  }
  
  if (errors.length > 0) {
    console.error('❌ Erros de configuração do Google OAuth:');
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  console.log('✅ Configuração do Google OAuth está correta');
  return true;
}

// Exportar funções para uso em outros arquivos
module.exports = {
  gerarUrlAutorizacao,
  trocarCodigoPorToken,
  buscarInformacoesUsuario,
  refrescarToken,
  googleAuthController,
  configurarRotasGoogle,
  integrarComUsuario,
  validarConfiguracao,
  googleConfig
};
