# 🔍 Sistema de Debug - Librarium API

## 📋 Visão Geral

O sistema de debug da Librarium API foi projetado para fornecer logging detalhado de todas as operações, requisições, erros e performance. Ele permite rastrear problemas, monitorar performance e entender o comportamento da aplicação em tempo real.

## 🚀 Funcionalidades Implementadas

### ✅ **Logging Detalhado de Requisições**
- ID único para cada requisição (`requestId`)
- Log de entrada e saída de todas as requisições
- Captura de headers, query params, body e parâmetros
- Sanitização automática de dados sensíveis
- Medição de tempo de resposta

### ✅ **Logging de Erros Categorizado**
- Erros de validação
- Erros de banco de dados
- Erros de autenticação/autorização
- Erros de APIs externas
- Erros de servidor

### ✅ **Logging de Performance**
- Detecção de requisições lentas (>1s)
- Medição de tempo de operações
- Log de operações de banco de dados
- Monitoramento de integrações externas

### ✅ **Logging de Segurança**
- Detecção de headers suspeitos
- Monitoramento de rate limiting
- Log de tentativas de acesso não autorizado
- Rastreamento de IPs e User-Agents

### ✅ **Logging de Validações**
- Validação de entrada de dados
- Resultados de validação por campo
- Log de regras de validação aplicadas

## 🔧 Configuração

### Variáveis de Ambiente

```env
# ===== LOGS =====
LOG_LEVEL=info                    # debug, info, warn, error
DEBUG_VALIDATION=false           # Logs detalhados de validação
DEBUG_DATABASE=false             # Logs de operações de banco
DEBUG_PERFORMANCE=true           # Logs de performance

# ===== CONFIGURAÇÕES BÁSICAS =====
NODE_ENV=development             # development, production
```

### Níveis de Log

- **`debug`**: Logs mais detalhados (desenvolvimento)
- **`info`**: Informações gerais (padrão)
- **`warn`**: Avisos e problemas não críticos
- **`error`**: Erros críticos

## 📊 Tipos de Logs Disponíveis

### 🎯 **Logs por Categoria**

#### **Requisições e Respostas**
```javascript
logger.request('Incoming Request', { requestId, method, url, userId });
logger.response('Request Completed', { requestId, statusCode, duration });
logger.debugLog('Debug Information', { requestId, details });
logger.errorLog('Error Information', { requestId, error, stack });
```

#### **Operações de Negócio**
```javascript
logger.habit('Hábito criado', { habitId, titulo, userId });
logger.achievement('Conquista desbloqueada', { achievementId, userId });
logger.business('Operação de negócio', { operation, details });
```

#### **Banco de Dados**
```javascript
logger.database('Operação de banco', { operation, collection, data });
logger.dbOperation('find', 'users', { filter: { active: true } });
```

#### **APIs Externas**
```javascript
logger.external('Google API', { service, operation, status, duration });
logger.externalApi('Google Calendar', 'createEvent', 200, 450);
```

#### **Segurança**
```javascript
logger.security('Tentativa suspeita', { ip, userAgent, headers });
logger.auth('Login realizado', { userId, email, nivel });
```

#### **Performance**
```javascript
logger.performance('Operação lenta', { duration, operation, threshold });
```

#### **Validações**
```javascript
logger.validation('Erro de validação', { field, value, rule });
logger.validationResult(true, 'email', 'test@example.com', 'email_format');
```

#### **Cache**
```javascript
logger.cache('Cache hit', { key, hit, ttl });
logger.cacheOperation('get', 'user:123', true, 3600);
```

## 🔍 Como Usar

### 1. **Logs Automáticos**

O sistema automaticamente loga:
- Todas as requisições HTTP
- Respostas e tempos de execução
- Erros e exceções
- Operações de banco de dados
- Integrações com APIs externas

### 2. **Logs Manuais nos Controllers**

```javascript
exports.concluir = async (req, res) => {
  const requestId = req.requestId;
  const startTime = Date.now();
  
  try {
    logger.debugLog('Iniciando conclusão de hábito', {
      requestId,
      userId: req.usuario._id,
      habitId: req.params.id
    });

    // ... lógica do controller ...

    const duration = Date.now() - startTime;
    logger.business('Hábito concluído com sucesso', {
      requestId,
      userId: req.usuario._id,
      experienciaGanha: 20,
      duration: `${duration}ms`
    });

    res.json({ sucesso: true, requestId });
  } catch (erro) {
    logger.errorLog('Erro ao concluir hábito', {
      requestId,
      error: erro.message,
      stack: erro.stack
    });
    
    res.status(500).json({ erro: 'Erro interno', requestId });
  }
};
```

### 3. **Rastreamento de Requisições**

Cada requisição recebe um `requestId` único que permite rastrear toda a jornada:

```javascript
// No middleware
req.requestId = Math.random().toString(36).substring(7);

// Nos logs
logger.debugLog('Operação iniciada', { requestId: req.requestId });
logger.business('Operação concluída', { requestId: req.requestId });
```

## 📁 Estrutura dos Logs

### Arquivos de Log

```
logs/
├── librarium.log      # Logs gerais
├── error.log          # Apenas erros
└── (logs antigos)     # Rotacionados automaticamente
```

### Formato dos Logs

```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "📥 Incoming Request",
  "requestId": "abc123",
  "method": "POST",
  "url": "/api/habitos/123/concluir",
  "userId": "user456",
  "duration": "250ms",
  "type": "request"
}
```

## 🧪 Testando o Sistema

### Executar Testes de Debug

```bash
# Testar todo o sistema de debug
npm run test:debug

# Testar apenas APIs do Google
npm run test:google
```

### Verificar Logs em Tempo Real

```bash
# Em desenvolvimento
LOG_LEVEL=debug npm run dev

# Em produção
LOG_LEVEL=info npm start
```

## 🔧 Middlewares Disponíveis

### 1. **Request Middleware**
- Logs de entrada e saída
- Medição de performance
- Sanitização de dados sensíveis

### 2. **Validation Logger**
- Logs de parâmetros, query e body
- Validação de entrada

### 3. **Database Logger**
- Contagem de operações de banco
- Resumo de performance

### 4. **Auth Logger**
- Logs de autenticação
- Rastreamento de usuários

### 5. **Security Logger**
- Detecção de atividades suspeitas
- Monitoramento de segurança

### 6. **Performance Logger**
- Detecção de operações lentas
- Alertas de performance

## 📊 Monitoramento e Alertas

### Alertas Automáticos

- **Requisições lentas**: >1 segundo
- **Erros de validação**: 400-499
- **Erros de servidor**: 500+
- **Rate limiting**: 429
- **Atividades suspeitas**: Headers inválidos

### Métricas Coletadas

- Tempo de resposta por endpoint
- Contagem de erros por tipo
- Operações de banco por requisição
- Integrações externas por status
- Tentativas de autenticação

## 🚨 Troubleshooting

### Problemas Comuns

#### **Logs não aparecem**
```bash
# Verificar nível de log
echo $LOG_LEVEL

# Configurar nível de debug
export LOG_LEVEL=debug
```

#### **Performance degradada**
```bash
# Desabilitar logs detalhados
export DEBUG_VALIDATION=false
export DEBUG_DATABASE=false
```

#### **Arquivos de log muito grandes**
```bash
# Limpar logs antigos
node -e "require('./utils/logger').cleanup(7)"
```

### Análise de Logs

#### **Buscar por RequestId**
```bash
grep "abc123" logs/librarium.log
```

#### **Filtrar por tipo de erro**
```bash
grep "type.*error" logs/error.log
```

#### **Analisar performance**
```bash
grep "Slow Request" logs/librarium.log
```

## 💡 Boas Práticas

### 1. **Use RequestId**
Sempre inclua o `requestId` nos logs para rastreamento:

```javascript
const requestId = req.requestId;
logger.debug('Operação iniciada', { requestId });
```

### 2. **Logs Estruturados**
Use objetos para dados estruturados:

```javascript
// ✅ Bom
logger.business('User created', { userId, email, nivel });

// ❌ Evitar
logger.business(`User ${userId} created with email ${email}`);
```

### 3. **Sanitize Dados Sensíveis**
O sistema sanitiza automaticamente, mas você pode ajudar:

```javascript
// Dados sensíveis são automaticamente mascarados
logger.debug('Login attempt', { email, password: '***' });
```

### 4. **Níveis Apropriados**
- **debug**: Informações de desenvolvimento
- **info**: Operações normais
- **warn**: Problemas não críticos
- **error**: Erros críticos

### 5. **Performance**
- Use logs assíncronos
- Evite logs em loops intensivos
- Configure rotação de logs

## 🔄 Rotação e Limpeza

### Rotação Automática
- Tamanho máximo: 10MB por arquivo
- Máximo de arquivos: 5
- Limpeza automática: 30 dias (produção)

### Limpeza Manual
```javascript
const logger = require('./utils/logger');

// Limpar logs com mais de 7 dias
await logger.cleanup(7);

// Obter estatísticas
const stats = logger.getStats();
console.log(stats);
```

## 📈 Monitoramento em Produção

### Métricas Importantes
- Taxa de erro por endpoint
- Tempo de resposta médio
- Operações de banco por requisição
- Status das integrações externas

### Alertas Recomendados
- Erros 5xx > 1%
- Tempo de resposta > 2s
- Rate limiting ativado
- Falhas de integração externa

---

**🎯 O sistema de debug está pronto para uso! Execute `npm run test:debug` para verificar se tudo está funcionando corretamente.**
