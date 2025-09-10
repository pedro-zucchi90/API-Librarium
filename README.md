# 🗡️ Librarium Backend - API RPG de Hábitos

Backend do Librarium, um gerenciador de hábitos gamificado com temática dark fantasy inspirado em Hollow Knight e Devil May Cry.

## 🎮 Características

- **Sistema de Gamificação**: XP, níveis, títulos e avatares evolutivos
- **Autenticação JWT**: Sistema seguro de login e registro
- **CRUD Completo**: Gerenciamento completo de hábitos e progresso
- **Estatísticas Avançadas**: Gráficos, heatmaps e análises detalhadas
- **Sistema de Conquistas**: Desbloqueio de achievements baseado em progresso
- **API RESTful**: Endpoints bem estruturados e documentados
- **Tema Dark Fantasy**: Mensagens e terminologia imersivas

## 🏗️ Tecnologias

- **Node.js** + **Express.js** - Framework web
- **MongoDB** + **Mongoose** - Banco de dados NoSQL
- **JWT** - Autenticação segura
- **bcrypt** - Criptografia de senhas
- **Helmet** + **CORS** - Segurança e configuração
- **Rate Limiting** - Proteção contra spam

## 📦 Instalação

### Pré-requisitos
- Node.js (v16 ou superior)
- MongoDB (local ou MongoDB Atlas)
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/librarium.git
cd librarium/backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/librarium
JWT_SECRET=sua_chave_secreta_super_forte_aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
```


4. **Inicie o servidor**
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

## 🚀 Endpoints da API

### 🔐 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/registrar` | Registrar novo usuário |
| POST | `/login` | Fazer login |
| GET | `/perfil` | Obter perfil do usuário |
| PUT | `/perfil` | Atualizar perfil |
| GET | `/verificar` | Verificar token |

### ⚔️ Hábitos (`/api/habitos`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar hábitos do usuário |
| POST | `/` | Criar novo hábito |
| GET | `/:id` | Obter hábito específico |
| PUT | `/:id` | Atualizar hábito |
| DELETE | `/:id` | Deletar hábito |
| POST | `/:id/concluir` | Marcar hábito como concluído |
| GET | `/:id/progresso` | Obter progresso do hábito |

### 👤 Usuários (`/api/usuarios`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/dashboard` | Dashboard do usuário |
| GET | `/estatisticas` | Estatísticas detalhadas |
| GET | `/ranking` | Ranking de usuários |
| GET | `/conquistas` | Conquistas do usuário |
| PUT | `/preferencias` | Atualizar preferências |

### 📊 Estatísticas (`/api/estatisticas`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/sistema` | Estatísticas gerais |
| GET | `/grafico-semanal` | Gráfico dos últimos 7 dias |
| GET | `/categorias` | Estatísticas por categoria |
| GET | `/heatmap` | Heatmap de atividades |
| GET | `/comparativo-mensal` | Comparativo mensal |

## 🎯 Modelos de Dados

### Usuário
```javascript
{
  nomeUsuario: String,
  email: String,
  senha: String (criptografada),
  experiencia: Number,
  nivel: Number,
  titulo: String,
  avatar: String,
  personalizacaoAvatar: {
    arma: String,
    armadura: String,
    acessorio: String
  },
  sequencia: {
    atual: Number,
    maiorSequencia: Number
  },
  preferencias: {
    notificacoes: Boolean,
    tema: String,
    idioma: String
  }
}
```

### Hábito
```javascript
{
  idUsuario: ObjectId,
  titulo: String,
  descricao: String,
  frequencia: String, // 'diario', 'semanal', 'mensal'
  categoria: String, // 'saude', 'estudo', 'trabalho', etc
  dificuldade: String, // 'facil', 'medio', 'dificil', 'lendario'
  recompensaExperiencia: Number,
  icone: String,
  cor: String,
  ativo: Boolean,
  sequencia: {
    atual: Number,
    maiorSequencia: Number
  },
  estatisticas: {
    totalConclusoes: Number,
    totalPerdidos: Number,
    taxaConclusao: Number
  }
}
```

### Progresso
```javascript
{
  idHabito: ObjectId,
  idUsuario: ObjectId,
  data: Date,
  status: String, // 'concluido', 'perdido', 'parcial'
  observacoes: String,
  experienciaGanha: Number,
  dificuldade: String
}
```

## 🏆 Sistema de Gamificação

### Níveis e Títulos
- **Nível 1-10**: Aspirante (100 XP por nível)
- **Nível 11-20**: Caçador
- **Nível 21-30**: Guardião do Librarium
- **Nível 31+**: Conjurador Supremo

### Recompensas por Dificuldade
- **Fácil**: 10 XP
- **Médio**: 20 XP
- **Difícil**: 35 XP
- **Lendário**: 50 XP

## 🔒 Segurança

- **JWT**: Autenticação baseada em tokens
- **bcrypt**: Hash seguro de senhas
- **Helmet**: Headers de segurança HTTP
- **Rate Limiting**: Proteção contra abuso da API
- **CORS**: Configurado para integração com Flutter
- **Validação**: Sanitização de entrada com express-validator

## ⚙️ Configuração

### Variáveis de Ambiente

Copie o arquivo `env.example` para `.env` e configure:

```bash
# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/librarium

# JWT
JWT_SECRET=sua_chave_secreta_jwt_aqui

# Google APIs (OAuth2)
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
```

**⚠️ IMPORTANTE sobre Google APIs:**
- Para as integrações com Google Calendar e Google Fit funcionarem, você **PRECISA** do `GOOGLE_CLIENT_ID`

## 🧪 Testando a API

### Verificar se o servidor está funcionando
```bash
curl http://localhost:3000/api/saude
```

### Registrar um usuário
```bash
curl -X POST http://localhost:3000/api/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{"nomeUsuario":"testuser","email":"test@example.com","senha":"123456"}'
```

### Fazer login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","senha":"123456"}'
```

## 🚧 Próximos Passos (Roadmap)

### MVP Concluído ✅
- [x] Sistema de autenticação
- [x] CRUD de hábitos
- [x] Sistema de XP/níveis
- [x] Progresso e estatísticas básicas

### Versão Intermediária 🔄
- [x] Sistema de conquistas automáticas
- [x] Avatar evolutivo visual
- [x] Exportação de dados
- [ ] Notificações (via webhook/email) - **Pausado**

### Versão Avançada 🎯
- [ ] Ranking multiplayer
- [ ] Sistema de batalhas de hábitos
- [ ] Integração com calendários
- [ ] Modo offline-first

### 🆕 Funcionalidades Implementadas

#### Sistema de Conquistas Avançado 🏆
- **25+ tipos de conquistas** com verificação automática
- **Sistema de raridade**: Comum, Raro, Épico, Lendário
- **Verificações inteligentes**: Sequências, eficiência, consistência
- **Recompensas de XP** baseadas na dificuldade
- **Conquistas personalizadas** criadas pelos usuários

#### Avatar Evolutivo Visual 🎭
- **6 níveis de evolução** baseados em XP e conquistas
- **Sistema de equipamentos** com desbloqueios automáticos
- **Efeitos visuais**: Auras, partículas e temas dinâmicos
- **Personalização avançada** de armas, armaduras e acessórios
- **Evolução automática** a cada 5 minutos

#### Sistema de Exportação de Dados 📊
- **Múltiplos formatos**: JSON, XML, ZIP
- **Backup automático** antes de importações
- **Validação de dados** e tratamento de erros
- **Estatísticas detalhadas** de exportação
- **Importação com opções** de mesclagem e sobrescrita

### 🔄 Verificação Automática
O sistema agora verifica automaticamente:
- **Conquistas** a cada 5 minutos
- **Evolução do avatar** a cada 5 minutos
- **Limpeza de dados** a cada 24 horas

## 🐛 Logs e Debug

O servidor registra todas as atividades importantes. Em desenvolvimento, os erros são exibidos com stack trace completo.

```bash
# Ver logs em tempo real
npm run dev
```

## 📝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

**🎮 Que a caçada comece! Bem-vindo ao Librarium!** ⚔️
