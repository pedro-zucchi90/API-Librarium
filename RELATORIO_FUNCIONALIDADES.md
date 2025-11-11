# 📋 Relatório de Funcionalidades - Librarium API

## 🎯 Visão Geral

Este documento descreve as funcionalidades implementadas no sistema Librarium, conforme indicado no endpoint de health check (`/api/saude`) nas linhas 140-145 do arquivo `server.js`.

**Data do Relatório:** $(date)
**Versão da API:** 1.0.0

---

## 📊 Status das Funcionalidades

```140:145:API-Librarium/server.js
      autenticacao: true,
      habitos: true,
      conquistas: true,
      avatarEvolutivo: true,
      multiplayer: true,
      sistemaConquistas: false
```

---

## 1. ✅ Sistema de Autenticação (`autenticacao: true`)

### 📝 Descrição
Sistema completo de autenticação baseado em JWT (JSON Web Tokens) que permite registro, login e gerenciamento de sessões de usuários.

### 🔧 Como Foi Implementado

#### **Arquitetura:**
- **Rotas:** `routes/authRoutes.js`
- **Controller:** `controllers/authController.js`
- **Middleware:** `middleware/auth.js`
- **JWT Config:** `config/jwt.js`
- **Model:** `models/User.js`

#### **Funcionalidades Implementadas:**

1. **Registro de Usuários** (`POST /api/auth/registrar`)
   - Validação de email e nome de usuário únicos
   - Hash de senha usando bcrypt
   - Criação automática de perfil inicial
   - Geração de token JWT após registro
   - Retorno de dados do usuário (sem senha)

2. **Login** (`POST /api/auth/login`)
   - Validação de credenciais
   - Comparação segura de senhas
   - Atualização de última atividade
   - Geração de token JWT
   - Retorno de dados completos do usuário

3. **Verificação de Token** (`GET /api/auth/verificar`)
   - Validação de token JWT
   - Verificação de expiração
   - Atualização de última atividade

4. **Gerenciamento de Perfil**
   - Obter perfil (`GET /api/auth/perfil`)
   - Atualizar perfil (`PUT /api/auth/perfil`)

#### **Segurança:**
- Senhas hasheadas com bcrypt (salt rounds: 10)
- Tokens JWT com expiração configurável
- Middleware de autenticação para rotas protegidas
- Validação de tokens em cada requisição
- Headers de segurança configurados (Helmet)

#### **Integração Frontend:**
- Provider Flutter: `Librarium-Front/lib/providers/auth_provider.dart`
- Armazenamento de token em SharedPreferences
- Gerenciamento automático de estado de autenticação

---

## 2. ✅ Sistema de Hábitos (`habitos: true`)

### 📝 Descrição
Sistema completo de CRUD para gerenciamento de hábitos com tracking de progresso, sequências, estatísticas e gamificação.

### 🔧 Como Foi Implementado

#### **Arquitetura:**
- **Rotas:** `routes/habitRoutes.js`
- **Controller:** `controllers/habitController.js`
- **Model:** `models/Habit.js`
- **Progress Model:** `models/Progress.js`

#### **Funcionalidades Implementadas:**

1. **CRUD Completo de Hábitos**
   - **Criar** (`POST /api/habitos/`)
     - Validação de campos obrigatórios
     - Cálculo automático de XP baseado na dificuldade
     - Categorização (saúde, estudo, trabalho, pessoal, social, criativo)
     - Frequências (diário, semanal, mensal)
     - Dificuldades (fácil, médio, difícil, lendário)
   
   - **Listar** (`GET /api/habitos/`)
     - Filtros por categoria, dificuldade, status
     - Ordenação por data, sequência, XP
     - Paginação opcional
   
   - **Obter** (`GET /api/habitos/:id`)
     - Detalhes completos do hábito
     - Estatísticas atualizadas
     - Progresso histórico
   
   - **Atualizar** (`PUT /api/habitos/:id`)
     - Edição de todos os campos
     - Recalculo de XP se dificuldade mudar
   
   - **Deletar** (`DELETE /api/habitos/:id`)
     - Exclusão lógica ou física
     - Limpeza de progressos relacionados

2. **Sistema de Progresso**
   - **Concluir Hábito** (`POST /api/habitos/:id/concluir`)
     - Criação de registro de progresso
     - Validação de duplicatas (não permite concluir duas vezes no mesmo dia)
     - Atualização de sequências (atual e maior sequência)
     - Cálculo de estatísticas (total de conclusões, taxa de conclusão)
     - Adição de XP ao usuário
     - Verificação automática de conquistas
     - Verificação de evolução do avatar
   
   - **Obter Progresso** (`GET /api/habitos/:id/progresso`)
     - Histórico completo de progressos
     - Filtros por período
     - Estatísticas agregadas

3. **Sistema de Sequências**
   - Cálculo automático de sequência atual (dias consecutivos)
   - Rastreamento de maior sequência histórica
   - Reset automático quando hábito não é completado
   - Suporte para diferentes frequências

4. **Estatísticas Avançadas**
   - Total de conclusões
   - Total de hábitos perdidos
   - Taxa de conclusão (percentual)
   - Média de conclusões por período
   - Campo virtual `ultimaDataConclusao` para compatibilidade com frontend

#### **Gamificação:**
- XP variável por dificuldade:
  - Fácil: 10 XP
  - Médio: 20 XP
  - Difícil: 35 XP
  - Lendário: 50 XP
- Sistema de sequências para motivação
- Integração com sistema de conquistas
- Integração com sistema de avatar

#### **Integração Frontend:**
- Provider Flutter: `Librarium-Front/lib/providers/habits_provider.dart`
- Model de dados: `Habit` class
- Sincronização automática de estado
- UI responsiva com cards de hábitos

---

## 3. ✅ Sistema de Conquistas (`conquistas: true`)

### 📝 Descrição
Sistema automatizado de conquistas (achievements) que desbloqueia recompensas baseadas no progresso do usuário.

### 🔧 Como Foi Implementado

#### **Arquitetura:**
- **Rotas:** `routes/achievementRoutes.js`
- **Controller:** `controllers/achievementController.js`
- **Service:** `services/achievementService.js` (900+ linhas)
- **Model:** `models/Achievement.js`

#### **Funcionalidades Implementadas:**

1. **Verificação Automática de Conquistas**
   - Executada automaticamente após conclusão de hábito
   - Executada periodicamente (a cada 5 minutos) via serviço de fundo
   - Verificação manual disponível (`POST /api/conquistas/verificar`)

2. **Tipos de Conquistas Suportadas:**
   - **Sequência:** Baseada em dias consecutivos
     - `sequencia_7_dias`, `sequencia_30_dias`
   - **Nível:** Baseada no nível do usuário
     - `nivel_10`, `nivel_20`, `nivel_30`
   - **Hábitos Concluídos:** Total de hábitos completados
   - **Dias Ativo:** Dias desde o registro
   - **XP Total:** Experiência acumulada
   - **Hábitos por Categoria:** Específico por categoria
   - **Sequência Perfeita:** Sem falhas em período
   - **Hábitos Diferentes:** Variedade de hábitos
   - **Eficiência Semanal:** Taxa de conclusão semanal
   - **Consistência Mensal:** Consistência ao longo do mês
   - **Hábitos Rápidos:** Conclusões rápidas
   - **Variedade de Categorias:** Diferentes categorias exploradas

3. **Sistema de Raridade**
   - **Comum:** Conquistas básicas
   - **Raro:** Conquistas intermediárias
   - **Épico:** Conquistas avançadas
   - **Lendário:** Conquistas excepcionais

4. **Recompensas**
   - XP variável baseado na raridade
   - Notificações automáticas
   - Histórico de desbloqueios
   - Integração com sistema de avatar

5. **Endpoints Disponíveis:**
   - `GET /api/conquistas/` - Listar conquistas
   - `POST /api/conquistas/verificar` - Verificar manualmente
   - `GET /api/conquistas/estatisticas` - Estatísticas de conquistas
   - `POST /api/conquistas/personalizada` - Criar conquista personalizada
   - `PUT /api/conquistas/:id/ler` - Marcar como lida
   - `GET /api/conquistas/categoria/:categoria` - Filtrar por categoria
   - `GET /api/conquistas/raridade/:raridade` - Filtrar por raridade
   - `GET /api/conquistas/progresso` - Progresso das conquistas
   - `GET /api/conquistas/proximas` - Próximas conquistas disponíveis

#### **Lógica de Verificação:**
O `AchievementService` implementa lógica complexa para verificar cada tipo de conquista:
- Consultas otimizadas ao banco de dados
- Cálculos de sequências e períodos
- Agregações de estatísticas
- Validação de condições múltiplas

#### **Limpeza Automática:**
- Limpeza de conquistas antigas (90+ dias) executada diariamente
- Otimização de performance do banco de dados

#### **Integração Frontend:**
- Provider Flutter: `Librarium-Front/lib/providers/achievements_provider.dart`
- Notificações de desbloqueio
- Visualização de progresso
- Filtros e categorização

---

## 4. ✅ Avatar Evolutivo (`avatarEvolutivo: true`)

### 📝 Descrição
Sistema de avatar que evolui visualmente baseado no progresso, nível e conquistas do usuário.

### 🔧 Como Foi Implementado

#### **Arquitetura:**
- **Rotas:** `routes/avatarRoutes.js`
- **Controller:** `controllers/avatarController.js`
- **Service:** `services/avatarService.js`
- **Config:** `config/avatar.js`
- **Model:** Integrado em `models/User.js`

#### **Funcionalidades Implementadas:**

1. **Evolução Automática por Nível**
   - **Aspirante** (Nível 1-10): Forma inicial
   - **Caçador** (Nível 11-20): Primeira evolução
   - **Guardião** (Nível 21-30): Evolução intermediária
   - **Conjurador** (Nível 31-39): Evolução avançada
   - **Conjurador Avançado** (Nível 40-49): Evolução superior
   - **Conjurador Supremo** (Nível 50+): Evolução máxima

2. **Evolução por Conquistas**
   - Desbloqueios especiais baseados em conquistas raras
   - Efeitos visuais exclusivos
   - Títulos personalizados

3. **Sistema de Equipamentos**
   - Armas desbloqueáveis
   - Armaduras desbloqueáveis
   - Acessórios especiais
   - Efeitos visuais (aura, partículas)

4. **Personalização**
   - Customização de aparência
   - Temas visuais
   - Efeitos baseados em equipamentos
   - Histórico de evoluções

5. **Endpoints Disponíveis:**
   - `POST /api/avatar/evolucao/verificar` - Verificar evolução
   - `GET /api/avatar/estatisticas` - Estatísticas do avatar
   - `GET /api/avatar/tema` - Tema visual atual
   - `GET /api/avatar/progresso` - Progresso para próxima evolução
   - `GET /api/avatar/historico` - Histórico de evoluções
   - `GET /api/avatar/proximos-desbloqueios` - Próximos desbloqueios

#### **Verificação Automática:**
- Executada após cada conclusão de hábito
- Executada periodicamente (a cada 5 minutos) via serviço de fundo
- Verificação de múltiplas condições simultaneamente

#### **Estrutura de Dados:**
```javascript
avatar: {
  tipo: String,           // Tipo atual do avatar
  nivel: Number,          // Nível de evolução (1-5)
  evolucao: String,      // Estágio de evolução
  desbloqueadoEm: Date   // Data do desbloqueio
}

personalizacaoAvatar: {
  arma: { tipo, nivel, desbloqueadaEm },
  armadura: { tipo, nivel, desbloqueadaEm },
  acessorio: { tipo, nivel, desbloqueadaEm },
  efeitos: { aura, particulas }
}
```

#### **Integração Frontend:**
- Provider Flutter: `Librarium-Front/lib/providers/avatar_provider.dart`
- Widget de avatar: `Librarium-Front/lib/widgets/avatar_widget.dart`
- Visualização de evoluções
- Animações de transição

---

## 5. ✅ Sistema Multiplayer (`multiplayer: true`)

### 📝 Descrição
Sistema completo de interação social com batalhas, desafios, mensagens e amizades.

### 🔧 Como Foi Implementado

#### **Arquitetura:**
- **Rotas:** `routes/multiplayerRoutes.js`
- **Controller:** `controllers/multiplayerController.js`
- **Models:**
  - `models/Battle.js` - Batalhas PvP
  - `models/Challenge.js` - Desafios personalizados
  - `models/Message.js` - Sistema de mensagens
  - `models/Friendship.js` - Sistema de amizades

#### **Funcionalidades Implementadas:**

1. **Sistema de Batalhas (PvP)**
   - **Criar Batalha** (`POST /api/multiplayer/batalha/criar`)
     - Seleção de adversário
     - Tipos de batalha (sequência, XP, hábitos concluídos)
     - Duração configurável
     - Critérios personalizados
     - Notificação automática ao adversário
   
   - **Aceitar Batalha** (`POST /api/multiplayer/batalha/:id/aceitar`)
     - Validação de permissões
     - Início automático da batalha
     - Notificação ao criador
   
   - **Finalizar Batalha** (`POST /api/multiplayer/batalha/:id/finalizar`)
     - Cálculo automático de vencedor
     - Distribuição de recompensas
     - Atualização de estatísticas
     - Histórico de resultados
   
   - **Listar Batalhas** (`GET /api/multiplayer/batalha`)
     - Filtros por status (aguardando, em_andamento, finalizada)
     - Batalhas do usuário
     - Batalhas pendentes
   
   - **Batalhas Pendentes** (`GET /api/multiplayer/batalha/pendentes`)
     - Apenas batalhas aguardando aceitação

2. **Sistema de Desafios**
   - **Criar Desafio** (`POST /api/multiplayer/desafio`)
     - Desafios personalizados entre usuários
     - Objetivos específicos
     - Prazos configuráveis
   
   - **Responder Desafio** (`POST /api/multiplayer/desafio/:id/responder`)
     - Aceitar ou recusar desafio
     - Tracking de progresso
   
   - **Listar Desafios** (`GET /api/multiplayer/desafio`)
     - Desafios enviados
     - Desafios recebidos
     - Filtros por status

3. **Sistema de Mensagens**
   - **Enviar Mensagem** (`POST /api/multiplayer/mensagem`)
     - Mensagens diretas entre usuários
     - Suporte a diferentes tipos de mensagem
   
   - **Listar Conversas** (`GET /api/multiplayer/mensagem/conversas`)
     - Lista de todas as conversas
     - Preview da última mensagem
     - Contador de não lidas
   
   - **Obter Conversa** (`GET /api/multiplayer/mensagem/conversa/:usuarioId`)
     - Histórico completo de mensagens
     - Paginação
   
   - **Marcar como Lida** (`PUT /api/multiplayer/mensagem/:id/ler`)
     - Atualização de status de leitura
   
   - **Mensagens Não Lidas** (`GET /api/multiplayer/mensagem/nao-lidas`)
     - Contador de mensagens não lidas

4. **Sistema de Amizades**
   - **Enviar Solicitação** (`POST /api/multiplayer/amizade/enviar`)
     - Envio de solicitação de amizade
     - Validação de duplicatas
   
   - **Aceitar Solicitação** (`POST /api/multiplayer/amizade/aceitar`)
     - Criação de relação de amizade
     - Notificação ao solicitante
   
   - **Rejeitar Solicitação** (`POST /api/multiplayer/amizade/rejeitar`)
     - Rejeição de solicitação
   
   - **Listar Amigos** (`GET /api/multiplayer/amizade/amigos`)
     - Lista completa de amigos
     - Estatísticas dos amigos
   
   - **Solicitações Pendentes** (`GET /api/multiplayer/amizade/pendentes`)
     - Solicitações recebidas
   
   - **Solicitações Enviadas** (`GET /api/multiplayer/amizade/enviadas`)
     - Solicitações enviadas (status)
   
   - **Remover Amizade** (`DELETE /api/multiplayer/amizade/remover`)
     - Remoção de amizade
   
   - **Buscar Usuários** (`GET /api/multiplayer/buscar-usuarios`)
     - Busca de usuários por nome
     - Filtros e paginação

5. **Funcionalidades Adicionais**
   - **Ranking** (`GET /api/multiplayer/ranking`)
     - Ranking global de usuários
     - Filtros por critério (XP, nível, sequência)
   
   - **Estatísticas** (`GET /api/multiplayer/estatisticas`)
     - Estatísticas multiplayer do usuário
     - Histórico de batalhas
     - Taxa de vitórias

#### **Lógica de Batalhas:**
- Comparação de métricas entre jogadores
- Cálculo automático de vencedor
- Recompensas baseadas no resultado
- Histórico completo de ações

#### **Integração Frontend:**
- Provider Flutter: `Librarium-Front/lib/providers/multiplayer_provider.dart`
- Provider de Mensagens: `Librarium-Front/lib/providers/messages_provider.dart`
- Provider de Amizades: `Librarium-Front/lib/providers/friends_provider.dart`
- Tela completa: `Librarium-Front/lib/screens/multiplayer/multiplayer_screen.dart`
- Interface com tabs (Batalhas, Desafios, Chat, Amigos)
- Polling automático de conversas
- Notificações em tempo real

---

## 6. ❌ Sistema de Conquistas Avançado (`sistemaConquistas: false`)

### 📝 Descrição
Flag indicando que existe um sistema de conquistas mais avançado ou alternativo que ainda não foi implementado ou está desabilitado.

### 🔧 Status Atual
- **Status:** Desabilitado (`false`)
- **Observação:** O sistema básico de conquistas (`conquistas: true`) está funcionando. Esta flag pode indicar:
  - Sistema de conquistas mais complexo planejado
  - Conquistas em tempo real
  - Conquistas colaborativas
  - Sistema de badges mais avançado
  - Conquistas sazonais/eventos

### 💡 Possíveis Implementações Futuras
- Conquistas em tempo real com WebSockets
- Conquistas colaborativas (guildas/grupos)
- Sistema de badges visuais
- Conquistas sazonais e eventos especiais
- Conquistas baseadas em machine learning
- Sistema de progressão de conquistas (bronze, prata, ouro)

---

## 🔄 Serviços de Fundo

### Verificação Automática
O servidor executa serviços automáticos em background:

1. **Verificação de Conquistas e Avatar** (a cada 5 minutos)
   ```javascript
   setInterval(async () => {
     const usuarios = await Usuario.find({});
     for (const usuario of usuarios) {
       await AchievementService.verificarConquistas(usuario._id);
       await AvatarService.verificarEvolucaoAvatar(usuario._id);
     }
   }, 5 * 60 * 1000);
   ```

2. **Limpeza Automática** (a cada 24 horas)
   ```javascript
   setInterval(async () => {
     await AchievementService.limparConquistasAntigas(90);
   }, 24 * 60 * 60 * 1000);
   ```

---

## 📊 Estatísticas de Implementação

### Arquivos Principais
- **Rotas:** 9 arquivos de rotas
- **Controllers:** 6 controllers principais
- **Services:** 2 serviços especializados
- **Models:** 7+ modelos de dados
- **Middlewares:** Sistema completo de autenticação e validação

### Linhas de Código (Aproximado)
- `achievementService.js`: ~900 linhas
- `multiplayerController.js`: ~464 linhas
- `habitController.js`: ~464 linhas
- `userController.js`: ~536 linhas
- Total estimado: 5000+ linhas de código backend

---

## 🔐 Segurança e Performance

### Segurança Implementada
- ✅ Autenticação JWT
- ✅ Hash de senhas (bcrypt)
- ✅ Rate limiting
- ✅ Helmet (headers de segurança)
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Sanitização de dados

### Performance
- ✅ Índices no banco de dados
- ✅ Queries otimizadas
- ✅ Compressão gzip
- ✅ Logging estruturado
- ✅ Health checks periódicos

---

## 📱 Integração Frontend

Todas as funcionalidades têm integração completa com o frontend Flutter:
- Providers de estado (Provider pattern)
- Models de dados tipados
- Serviços de API centralizados
- UI responsiva e moderna
- Tratamento de erros
- Loading states
- Notificações


