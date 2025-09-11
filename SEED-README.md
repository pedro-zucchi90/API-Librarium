# 🗡️ Librarium - Seed Completa de Testes

Este arquivo contém uma seed completa que testa **TODAS** as rotas da API Librarium, criando dados de teste e validando funcionalidades.

## 🚀 **Como Usar**

### **1. Teste Local:**
```bash
# Garanta que o servidor está rodando
npm start

# Em outro terminal, execute a seed
npm run seed:local
```

### **2. Teste no Railway:**
```bash
# Substitua pela URL real do seu projeto
npm run seed:railway
```

### **3. Teste Manual:**
```bash
# Para URL personalizada
API_URL=https://sua-api.com node seed-completa.js
```

## 📊 **O que a Seed Testa**

### **🔐 Autenticação (5 testes)**
- ✅ Registro de usuários
- ✅ Login de usuários  
- ✅ Verificação de token
- ✅ Obter perfil
- ✅ Atualizar perfil

### **📝 Hábitos (6 testes)**
- ✅ Criar hábitos
- ✅ Listar hábitos
- ✅ Obter hábito específico
- ✅ Atualizar hábito
- ✅ Concluir hábito
- ✅ Obter progresso do hábito

### **👤 Usuários (8 testes)**
- ✅ Dashboard do usuário
- ✅ Estatísticas do usuário
- ✅ Ranking de usuários
- ✅ Conquistas do usuário
- ✅ Evoluir avatar
- ✅ Customizar avatar
- ✅ Exportar dados do usuário
- ✅ Atualizar preferências

### **🏆 Conquistas (7 testes)**
- ✅ Listar conquistas
- ✅ Verificar conquistas
- ✅ Estatísticas de conquistas
- ✅ Progresso das conquistas
- ✅ Próximas conquistas
- ✅ Conquistas por categoria
- ✅ Conquistas por raridade

### **🎭 Avatar (6 testes)**
- ✅ Verificar evolução do avatar
- ✅ Estatísticas do avatar
- ✅ Tema do avatar
- ✅ Progresso do avatar
- ✅ Histórico do avatar
- ✅ Próximos desbloqueios do avatar

### **📈 Estatísticas (5 testes)**
- ✅ Estatísticas do sistema
- ✅ Gráfico semanal
- ✅ Estatísticas por categorias
- ✅ Heatmap de atividades
- ✅ Comparativo mensal

### **🛒 Loja (2 testes)**
- ✅ Listar itens da loja
- ✅ Comprar item da loja

### **💾 Dados (6 testes)**
- ✅ Exportar dados em JSON
- ✅ Exportar dados em XML
- ✅ Exportar dados em ZIP
- ✅ Listar backups
- ✅ Estatísticas de exportação
- ✅ Obter configurações de dados

### **🔗 Integrações (4 testes)**
- ✅ Status das integrações
- ✅ Iniciar OAuth Google
- ✅ Listar eventos Google Calendar
- ✅ Obter dados de saúde

### **⚔️ Multiplayer (7 testes)**
- ✅ Criar batalha
- ✅ Listar batalhas
- ✅ Criar desafio
- ✅ Listar desafios
- ✅ Enviar mensagem
- ✅ Ranking multiplayer
- ✅ Estatísticas multiplayer

## 📋 **Dados de Teste Criados**

A seed cria automaticamente:

- **3 usuários de teste** com perfis diferentes
- **5 hábitos de teste** em várias categorias
- **Tokens de autenticação** para todos os usuários
- **Dados de progresso** e estatísticas
- **Conquistas desbloqueadas** automaticamente

## 🎯 **Funcionalidades Testadas**

### **Rotas Testadas: 56 endpoints**

| Categoria | Endpoints | Status |
|-----------|-----------|--------|
| Autenticação | 5 | ✅ |
| Hábitos | 6 | ✅ |
| Usuários | 8 | ✅ |
| Conquistas | 7 | ✅ |
| Avatar | 6 | ✅ |
| Estatísticas | 5 | ✅ |
| Loja | 2 | ✅ |
| Dados | 6 | ✅ |
| Integrações | 4 | ✅ |
| Multiplayer | 7 | ✅ |
| **TOTAL** | **56** | **✅** |

## 🔧 **Configuração**

### **Variáveis de Ambiente:**
```env
API_URL=http://localhost:3000  # URL da API (opcional)
```

### **Dependências:**
- `axios` - Para requisições HTTP
- `fs` - Para manipulação de arquivos
- `path` - Para caminhos de arquivos

## 📊 **Saída da Seed**

A seed fornece feedback detalhado:

```
🗡️ LIBRARIUM - SEED COMPLETA DE TESTES
============================================================
🔐 AUTENTICAÇÃO
============================================================
✅ Registro de usuário 1 - teste_seed_1
✅ Login de usuário 1 - teste_seed_1
✅ Verificação de token
✅ Obter perfil
✅ Atualizar perfil

📝 HÁBITOS
============================================================
✅ Criar hábito 1 - Meditação Matinal
✅ Listar hábitos - 5 hábitos encontrados
✅ Obter hábito específico
✅ Atualizar hábito
✅ Concluir hábito
✅ Obter progresso do hábito

... (continua para todas as categorias)

============================================================
🗡️ RESUMO FINAL
============================================================
⏱️  Tempo total: 15.32s
✅ Testes executados com sucesso!
📊 Dados de teste criados:
   - 3 usuários
   - 5 hábitos
   - 3 tokens de autenticação

🎉 Seed completa executada com sucesso!
A API Librarium está funcionando perfeitamente!
```

## 🚨 **Troubleshooting**

### **Erro de Conexão:**
```
❌ Não foi possível conectar à API. Verifique se o servidor está rodando.
```
**Solução:** Execute `npm start` antes de rodar a seed.

### **Erro de Autenticação:**
```
❌ Login de usuário 1 - Email ou senha inválidos
```
**Solução:** Verifique se o banco de dados está conectado e limpo.

### **Erro de CORS:**
```
❌ Network Error: CORS policy
```
**Solução:** Verifique se o CORS está configurado corretamente no servidor.

## 🎉 **Conclusão**

Esta seed é uma ferramenta completa para:
- ✅ **Validar** todas as funcionalidades da API
- ✅ **Testar** integração entre componentes
- ✅ **Popular** dados de teste
- ✅ **Verificar** se o deploy está funcionando
- ✅ **Documentar** o uso da API

**Use sempre antes de fazer deploy para garantir que tudo está funcionando!** 🚀
