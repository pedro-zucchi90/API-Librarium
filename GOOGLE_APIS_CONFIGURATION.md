# 🔧 Configuração das APIs do Google - Librarium

## 📋 Visão Geral

Este guia te ajudará a configurar as APIs do Google necessárias para o Librarium. Atualmente, o projeto utiliza apenas **Google OAuth** para autenticação social.

## 🚀 Passo 1: Acessar o Google Cloud Console

### 1.1 Criar Conta e Acessar
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Se não tiver conta, crie uma em [accounts.google.com](https://accounts.google.com)

### 1.2 Criar Novo Projeto
1. No topo da página, clique em "Selecionar um projeto"
2. Clique em "NOVO PROJETO"
3. **Nome do projeto**: `Librarium API`
4. **Organização**: (deixe vazio se não tiver)
5. Clique em "CRIAR"
6. Aguarde alguns segundos e selecione o projeto criado

## 🔐 Passo 2: Configurar Google OAuth

### 2.1 Ativar Google+ API
1. No menu lateral, vá em **"APIs e serviços"** > **"Biblioteca"**
2. Busque por **"Google+ API"** ou **"Google Identity"**
3. Clique na API e depois em **"ATIVAR"**
4. Aguarde a ativação

### 2.2 Configurar Tela de Consentimento
1. Vá em **"APIs e serviços"** > **"Tela de consentimento OAuth"**
2. Se aparecer uma tela de configuração, escolha **"Externo"**
3. Clique em **"CRIAR"**

**Preencha as informações obrigatórias:**
- **Nome do aplicativo**: `Librarium`
- **Email de suporte do usuário**: `seu-email@gmail.com`
- **Email de contato do desenvolvedor**: `seu-email@gmail.com`

**Domínios autorizados (para desenvolvimento):**
- Adicione: `localhost`

4. Clique em **"SALVAR E CONTINUAR"**

### 2.3 Criar Credenciais OAuth
1. Vá em **"APIs e serviços"** > **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"** > **"ID do cliente OAuth 2.0"**
3. **Tipo de aplicativo**: `Aplicativo da Web`
4. **Nome**: `Librarium Web Client`

**URIs de redirecionamento autorizados:**
```
http://localhost:3000/api/integracao/google/oauth/callback
```

**Para produção, adicione também:**
```
https://seu-dominio.com/api/integracao/google/oauth/callback
```

5. Clique em **"CRIAR"**

### 2.4 Copiar as Credenciais
Após criar, você verá uma tela com:
- **ID do cliente**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Chave secreta do cliente**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

**⚠️ IMPORTANTE**: Copie essas informações e guarde em local seguro!

## 📝 Passo 3: Configurar o Arquivo .env

### 3.1 Criar Arquivo .env
1. Na raiz do projeto, crie um arquivo chamado `.env`
2. Copie o conteúdo do `env.example`:

```bash
cp env.example .env
```

### 3.2 Configurar as Variáveis OAuth
Abra o arquivo `.env` e configure as seguintes variáveis:

```env
# ===== GOOGLE APIs =====
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integracao/google/oauth/callback
```

**Substitua pelos seus valores reais:**
- `GOOGLE_CLIENT_ID`: O ID do cliente que você copiou
- `GOOGLE_CLIENT_SECRET`: A chave secreta que você copiou
- `GOOGLE_REDIRECT_URI`: URL de callback (mantenha como está para desenvolvimento)

### 3.3 Configurar Outras Variáveis Necessárias
Certifique-se de que estas variáveis também estão configuradas:

```env
# ===== CONFIGURAÇÕES BÁSICAS =====
NODE_ENV=development
PORT=3000

# ===== BANCO DE DADOS =====
MONGODB_URI=mongodb://localhost:27017/librarium

# ===== AUTENTICAÇÃO JWT =====
JWT_SECRET=sua_chave_secreta_jwt_aqui_muito_segura
JWT_EXPIRES_IN=7d

# ===== FRONTEND =====
FRONTEND_URL=http://localhost:3001
```

## 🧪 Passo 4: Testar a Configuração

### 4.1 Instalar Dependências
```bash
npm install
```

### 4.2 Iniciar o Servidor
```bash
npm run dev
```

### 4.3 Testar OAuth (se implementado)
Se você tiver implementado o OAuth, pode testar acessando:
```
http://localhost:3000/api/integracao/google/oauth
```

## 🔒 Passo 5: Configurações de Segurança

### 5.1 Restrições de Credenciais (Recomendado)
1. No Google Cloud Console, vá em **"APIs e serviços"** > **"Credenciais"**
2. Clique no ícone de editar do seu OAuth 2.0 Client ID
3. **Restrições de aplicativo**:
   - ✅ Restrição por referenciador HTTP
   - Adicione: `http://localhost:3000/*`
   - Para produção: `https://seu-dominio.com/*`
4. Clique em **"SALVAR"**

### 5.2 Proteger o Arquivo .env
Certifique-se de que o `.env` está no `.gitignore`:

```gitignore
# Arquivo de ambiente
.env
.env.local
.env.production
```

## 🚀 Passo 6: Deploy em Produção

### 6.1 Configurar Domínio de Produção
1. No Google Cloud Console, edite suas credenciais OAuth
2. Adicione o domínio de produção nas **URIs de redirecionamento**:
   ```
   https://seu-dominio.com/api/integracao/google/oauth/callback
   ```
3. Adicione o domínio nos **Domínios autorizados**:
   ```
   seu-dominio.com
   ```

### 6.2 Variáveis de Ambiente no Railway/Vercel
Configure as variáveis no seu provedor de hospedagem:

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=https://seu-projeto.railway.app/api/integracao/google/oauth/callback
```

## 🛠️ Troubleshooting

### Problema: "Error 400: redirect_uri_mismatch"
**Solução:**
1. Verifique se a URI de redirecionamento no `.env` está exatamente igual à configurada no Google Console
2. Certifique-se de que não há espaços extras ou caracteres especiais

### Problema: "Error 403: access_denied"
**Solução:**
1. Verifique se o domínio está autorizado na tela de consentimento
2. Certifique-se de que a API está ativada

### Problema: "Error 401: invalid_client"
**Solução:**
1. Verifique se o Client ID e Client Secret estão corretos no `.env`
2. Certifique-se de que não há espaços extras nas variáveis

### Problema: "This app isn't verified"
**Solução:**
1. Para desenvolvimento, clique em "Avançado" > "Ir para Librarium (não seguro)"
2. Para produção, você precisará verificar o app no Google Console

## 📊 APIs Disponíveis no Projeto

### ✅ Implementadas
- **Google OAuth 2.0** - Para login social

### 🔄 Futuras (se necessário)
- **Google Calendar API** - Para sincronização de hábitos
- **Google Drive API** - Para backup de dados
- **Google Maps API** - Para funcionalidades de localização

## 🎯 Próximos Passos

1. **Testar OAuth**: Implemente e teste o login com Google
2. **Configurar Frontend**: Configure o frontend para usar as credenciais
3. **Deploy**: Configure as variáveis no ambiente de produção
4. **Monitorar**: Acompanhe o uso das APIs no Google Console

## 📞 Suporte

Se precisar de ajuda:
1. Consulte a [documentação oficial do Google OAuth](https://developers.google.com/identity/protocols/oauth2)
2. Verifique os logs do servidor
3. Teste as credenciais individualmente
4. Consulte o console do Google Cloud para verificar quotas e limites

---

**Lembre-se**: Mantenha suas credenciais seguras e nunca as compartilhe publicamente! 🔐
