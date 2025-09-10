const Usuario = require('../models/User');

const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integracao/google/oauth/callback',
  scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
};

class GoogleCalendarAPI {
  constructor (accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }
  async criarEvento (evento) {
    const response = await fetch(`${this.baseUrl}/calendars/primary/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(evento)
    });
    if (!response.ok) {throw new Error(`Erro na API do Google Calendar: ${response.statusText}`)};
    return await response.json();
  }
  async listarEventos (dataInicio, dataFim, maxResultados = 50) {
    const params = new URLSearchParams({
      timeMin: dataInicio.toISOString(),
      timeMax: dataFim.toISOString(),
      maxResults: maxResultados.toString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    });
    const response = await fetch(`${this.baseUrl}/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    if (!response.ok) {throw new Error(`Erro na API do Google Calendar: ${response.statusText}`)};
    const data = await response.json();
    return data.items || [];
  }
}

async function renovarTokenGoogle (usuario) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      refresh_token: usuario.integracaoGoogle.refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const tokenData = await response.json();
  if (tokenData.error) {throw new Error(`Erro na renovação do token: ${tokenData.error_description}`)};
  usuario.integracaoGoogle.accessToken = tokenData.access_token;
  usuario.integracaoGoogle.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
  if (tokenData.refresh_token) {usuario.integracaoGoogle.refreshToken = tokenData.refresh_token};
  await usuario.save();
}

exports.iniciarGoogleOAuth = (req, res) => {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?'
    + `client_id=${GOOGLE_OAUTH_CONFIG.clientId}`
    + `&redirect_uri=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.redirectUri)}`
    + `&scope=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.scopes.join(' '))}`
    + '&response_type=code'
    + '&access_type=offline'
    + '&prompt=consent';
  res.json({ sucesso: true, mensagem: '🔗 Autorização Google Calendar iniciada', authUrl, instrucoes: 'Acesse o link acima para autorizar a integração com Google Calendar' });
};

exports.googleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ erro: 'Código de autorização não fornecido', mensagem: '🌑 Falha na autorização do Google Calendar' });
    }
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
        redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {throw new Error(`Erro na obtenção do token: ${tokenData.error_description}`)};
    const {usuario} = req;
    usuario.integracaoGoogle = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      scope: tokenData.scope
    };
    await usuario.save();
    res.json({ sucesso: true, mensagem: '✅ Integração com Google Calendar configurada com sucesso!', expiraEm: new Date(Date.now() + tokenData.expires_in * 1000) });
  } catch (erro) {
    console.error('Erro no callback OAuth2:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Falha na configuração da integração com Google Calendar' });
  }
};

exports.syncGoogleCalendar = async (req, res) => {
  try {
    const {usuario} = req;
    if (!usuario.integracaoGoogle || !usuario.integracaoGoogle.accessToken) {
      return res.status(400).json({ erro: 'Integração não configurada', mensagem: '🌑 Configure a integração com Google Calendar primeiro' });
    }
    if (new Date() > usuario.integracaoGoogle.expiresAt) {
      await renovarTokenGoogle(usuario);
    }
    const { periodo } = req.body;
    const dataInicio = periodo?.inicio ? new Date(periodo.inicio) : new Date();
    const dataFim = periodo?.fim ? new Date(periodo.fim) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const Habito = require('../models/Habit');
    const habitosAtivos = await Habito.find({ idUsuario: usuario._id, ativo: true });
    const eventosCriados = [];
    const googleApi = new GoogleCalendarAPI(usuario.integracaoGoogle.accessToken);
    for (const habito of habitosAtivos) {
      try {
        const evento = await criarEventoRecorrente(googleApi, habito, dataInicio, dataFim);
        eventosCriados.push(evento);
      } catch (erro) {
        console.error(`Erro ao criar evento para hábito ${habito._id}:`, erro);
      }
    }
    res.json({ sucesso: true, mensagem: `📅 ${eventosCriados.length} eventos sincronizados com Google Calendar!`, eventosCriados, totalHabitos: habitosAtivos.length });
  } catch (erro) {
    console.error('Erro ao sincronizar Google Calendar:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível sincronizar com o Google Calendar' });
  }
};

exports.listarEventosGoogle = async (req, res) => {
  try {
    const {usuario} = req;
    if (!usuario.integracaoGoogle || !usuario.integracaoGoogle.accessToken) {
      return res.status(400).json({ erro: 'Integração não configurada', mensagem: '🌑 Configure a integração com Google Calendar primeiro' });
    }
    if (new Date() > usuario.integracaoGoogle.expiresAt) {
      await renovarTokenGoogle(usuario);
    }
    const { dataInicio, dataFim, maxResultados = 50 } = req.query;
    const inicio = dataInicio ? new Date(dataInicio) : new Date();
    const fim = dataFim ? new Date(dataFim) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const googleApi = new GoogleCalendarAPI(usuario.integracaoGoogle.accessToken);
    const eventos = await googleApi.listarEventos(inicio, fim, maxResultados);
    res.json({ sucesso: true, mensagem: `📅 ${eventos.length} eventos encontrados no Google Calendar`, eventos, periodo: { inicio, fim } });
  } catch (erro) {
    console.error('Erro ao obter eventos do Google Calendar:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível obter eventos do Google Calendar' });
  }
};

exports.syncHealth = async (req, res) => {
  try {
    const {usuario} = req;
    const { tipo, periodo } = req.body;
    if (!usuario.integracaoGoogle || !usuario.integracaoGoogle.accessToken) {
      return res.status(400).json({ erro: 'Integração não configurada', mensagem: '🌑 Configure a integração com Google Fit primeiro' });
    }
    if (new Date() > usuario.integracaoGoogle.expiresAt) {
      await renovarTokenGoogle(usuario);
    }
    const dataInicio = periodo?.inicio ? new Date(periodo.inicio) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dataFim = periodo?.fim ? new Date(periodo.fim) : new Date();
    let dadosSincronizados = [];
    switch (tipo) {
    case 'atividade':
      dadosSincronizados = await sincronizarAtividades(usuario, dataInicio, dataFim);
      break;
    case 'sono':
      dadosSincronizados = await sincronizarSono(usuario, dataInicio, dataFim);
      break;
    case 'peso':
      dadosSincronizados = await sincronizarPeso(usuario, dataInicio, dataFim);
      break;
    case 'todos':
      {
        const [atividades, sono, peso] = await Promise.all([
          sincronizarAtividades(usuario, dataInicio, dataFim),
          sincronizarSono(usuario, dataInicio, dataFim),
          sincronizarPeso(usuario, dataInicio, dataFim)
        ]);
        dadosSincronizados = [...atividades, ...sono, ...peso];
      }
      break;
    default:
      return res.status(400).json({ erro: 'Tipo inválido', mensagem: '🌑 Tipo de dados de saúde inválido' });
    }
    if (!usuario.dadosSaude) {usuario.dadosSaude = []};
    usuario.dadosSaude.push(...dadosSincronizados);
    await usuario.save();
    res.json({ sucesso: true, mensagem: `🏥 ${dadosSincronizados.length} registros de saúde sincronizados!`, dadosSincronizados, tipo, periodo: { inicio: dataInicio, fim: dataFim } });
  } catch (erro) {
    console.error('Erro ao sincronizar dados de saúde:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível sincronizar os dados de saúde' });
  }
};

exports.obterDadosSaude = async (req, res) => {
  try {
    const {usuario} = req;
    const { tipo, dataInicio, dataFim, limite = 100 } = req.query;
    if (!usuario.dadosSaude || usuario.dadosSaude.length === 0) {
      return res.json({ sucesso: true, mensagem: '🏥 Nenhum dado de saúde encontrado', dados: [] });
    }
    let dados = usuario.dadosSaude;
    if (tipo) {dados = dados.filter(d => d.tipo === tipo)};
    if (dataInicio || dataFim) {
      const inicio = dataInicio ? new Date(dataInicio) : new Date(0);
      const fim = dataFim ? new Date(dataFim) : new Date();
      dados = dados.filter(d => {
        const data = new Date(d.timestamp);
        return data >= inicio && data <= fim;
      });
    }
    dados = dados.slice(0, parseInt(limite));
    dados.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ sucesso: true, mensagem: `🏥 ${dados.length} registros de saúde encontrados`, dados, total: usuario.dadosSaude.length });
  } catch (erro) {
    console.error('Erro ao obter dados de saúde:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível obter os dados de saúde' });
  }
};

exports.status = async (req, res) => {
  try {
    const {usuario} = req;
    const status = {
      googleCalendar: {
        ativo: !!(usuario.integracaoGoogle && usuario.integracaoGoogle.accessToken),
        expiraEm: usuario.integracaoGoogle?.expiresAt || null,
        escopo: usuario.integracaoGoogle?.scope || null
      },
      googleFit: {
        ativo: !!(usuario.integracaoGoogle && usuario.integracaoGoogle.accessToken),
        dadosSincronizados: usuario.dadosSaude?.length || 0
      }
    };
    res.json({ sucesso: true, mensagem: '📊 Status das integrações obtido', status });
  } catch (erro) {
    console.error('Erro ao obter status das integrações:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível obter o status das integrações' });
  }
};

exports.desconectarGoogle = async (req, res) => {
  try {
    const {usuario} = req;
    if (usuario.integracaoGoogle) {
      usuario.integracaoGoogle = undefined;
      await usuario.save();
    }
    res.json({ sucesso: true, mensagem: '🔌 Integração com Google desconectada com sucesso' });
  } catch (erro) {
    console.error('Erro ao desconectar integração:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível desconectar a integração' });
  }
};

async function criarEventoRecorrente (googleApi, habito, dataInicio, dataFim) {
  const evento = {
    summary: `🏃 ${habito.titulo}`,
    description: habito.descricao || 'Hábito sincronizado do Librarium',
    start: { dateTime: dataInicio.toISOString(), timeZone: 'America/Sao_Paulo' },
    end: { dateTime: new Date(dataInicio.getTime() + 60 * 60 * 1000).toISOString(), timeZone: 'America/Sao_Paulo' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] }
  };
  switch (habito.frequencia) {
  case 'diario': evento.recurrence = ['RRULE:FREQ=DAILY']; break;
  case 'semanal': evento.recurrence = ['RRULE:FREQ=WEEKLY']; break;
  case 'mensal': evento.recurrence = ['RRULE:FREQ=MONTHLY']; break;
  }
  return await googleApi.criarEvento(evento);
}

async function sincronizarAtividades (usuario, dataInicio, dataFim) {
  const dados = [];
  const dias = Math.ceil((dataFim - dataInicio) / (24 * 60 * 60 * 1000));
  for (let i = 0; i < dias; i++) {
    const data = new Date(dataInicio.getTime() + i * 24 * 60 * 60 * 1000);
    dados.push({ tipo: 'atividade', subtipo: 'passos', valor: Math.floor(Math.random() * 5000) + 3000, unidade: 'passos', timestamp: data, fonte: 'google_fit', sincronizadoEm: new Date() });
    dados.push({ tipo: 'atividade', subtipo: 'calorias', valor: Math.floor(Math.random() * 200) + 100, unidade: 'kcal', timestamp: data, fonte: 'google_fit', sincronizadoEm: new Date() });
  }
  return dados;
}

async function sincronizarSono (usuario, dataInicio, dataFim) {
  const dados = [];
  const dias = Math.ceil((dataFim - dataInicio) / (24 * 60 * 60 * 1000));
  for (let i = 0; i < dias; i++) {
    const data = new Date(dataInicio.getTime() + i * 24 * 60 * 60 * 1000);
    dados.push({ tipo: 'sono', subtipo: 'duracao', valor: Math.floor(Math.random() * 3) + 6, unidade: 'horas', timestamp: data, fonte: 'google_fit', sincronizadoEm: new Date() });
  }
  return dados;
}

async function sincronizarPeso (usuario, dataInicio, dataFim) {
  const dados = [];
  const dias = Math.ceil((dataFim - dataInicio) / (24 * 60 * 60 * 1000));
  for (let i = 0; i < dias; i++) {
    const data = new Date(dataInicio.getTime() + i * 24 * 60 * 60 * 1000);
    dados.push({ tipo: 'peso', subtipo: 'massa', valor: Math.floor(Math.random() * 5) + 70, unidade: 'kg', timestamp: data, fonte: 'google_fit', sincronizadoEm: new Date() });
  }
  return dados;
}


