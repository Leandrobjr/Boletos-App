# 🚀 Guia Completo de Integração Vercel - BXC Boletos App

> **Documentação técnica completa para deploy e manutenção da aplicação no Vercel**

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura da Solução](#arquitetura-da-solução)
3. [Configuração do Backend](#configuração-do-backend)
4. [Configuração do Frontend](#configuração-do-frontend)
5. [Processo de Deploy](#processo-de-deploy)
6. [Troubleshooting](#troubleshooting)
7. [Monitoramento e Logs](#monitoramento-e-logs)
8. [Best Practices](#best-practices)

---

## 🎯 Visão Geral

Esta aplicação utiliza uma arquitetura **Full-Stack Serverless** no Vercel, com separação clara entre frontend e backend para máxima escalabilidade e performance.

### Tecnologias Utilizadas
- **Frontend**: React + Vite (Vercel Static Hosting)
- **Backend**: Node.js Serverless Functions (Vercel Functions)
- **Database**: PostgreSQL (Neon)
- **Authentication**: Firebase Auth
- **Deploy**: Vercel CLI + GitHub Integration

---

## 🏗️ Arquitetura da Solução

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vite)  │◄──►│   (Serverless)  │◄──►│   (Neon PG)     │
│   Vercel Static │    │   Vercel Funcs  │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ├─ Authentication ──────┼─ API Routes ─────────┼─ Data Storage
         ├─ UI/UX               ├─ Business Logic      ├─ Users
         ├─ State Management    ├─ CORS Handling       ├─ Boletos
         └─ API Communication   └─ Error Handling      └─ Transactions
```

### URLs de Produção
- **Frontend**: `https://boletos-app-mocha.vercel.app`
- **Backend**: `https://boletos-backend-290725.vercel.app`

---

## ⚙️ Configuração do Backend

### Estrutura de Arquivos
```
backend-bxc/
├── api/
│   ├── hello.js                 # Endpoint de teste
│   ├── perfil.js               # CRUD de perfil base
│   └── perfil/
│       └── [uid].js            # Perfil por UID dinâmico
├── vercel.json                 # Configuração do Vercel
├── package.json               # Dependências e scripts
└── .env                       # Variáveis de ambiente
```

### vercel.json - Configuração Principal
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/perfil/([^/]+)",
      "destination": "/api/perfil/[uid]?uid=$1"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

**Explicação das Rotas:**
- **Linha 4-7**: Captura URLs dinâmicas `/api/perfil/ABC123` e redireciona para `/api/perfil/[uid].js`
- **Linha 8-11**: Catch-all para outras rotas da API

### package.json - Configuração Node.js
```json
{
  "name": "backend-bxc",
  "version": "1.0.0",
  "description": "Backend para BoletoXCrypto - Vercel Functions",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "vercel dev",
    "build": "echo 'Build complete'"
  },
  "dependencies": {
    "pg": "^8.11.3"
  }
}
```

**Pontos Críticos:**
- ❌ **NÃO** usar `"type": "module"` (Vercel requer CommonJS)
- ✅ **SIM** usar `engines.node` para especificar versão
- ✅ **SIM** manter `build` script simples

### Estrutura da API Function
```javascript
// backend-bxc/api/hello.js
const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // 1. CORS Headers (OBRIGATÓRIO)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 2. Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Lógica da API
  try {
    // Sua lógica aqui
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
```

### Rotas Dinâmicas
```javascript
// backend-bxc/api/perfil/[uid].js
module.exports = async (req, res) => {
  // Extrair parâmetro dinâmico
  const url = new URL(req.url, `http://${req.headers.host}`);
  const uid = url.searchParams.get('uid') || url.pathname.split('/').pop();
  
  // Resto da lógica...
};
```

---

## 🎨 Configuração do Frontend

### Estrutura de Arquivos
```
frontend/
├── src/
│   ├── config/
│   │   └── apiConfig.js        # Configuração de URLs
│   ├── components/
│   ├── pages/
│   └── services/
├── package.json
└── vercel.json                # Configuração SPA
```

### apiConfig.js - Detecção de Ambiente
```javascript
// frontend/src/config/apiConfig.js
const getCorrectApiUrl = () => {
  const currentHost = window.location.hostname;
  
  console.log('🔍 DETECTANDO ambiente:', {
    hostname: currentHost,
    fullUrl: window.location.href
  });
  
  // PRODUÇÃO: Vercel do frontend
  if (currentHost.includes('vercel.app') || currentHost.includes('boletos-app')) {
    const prodUrl = 'https://boletos-backend-290725.vercel.app/api';
    console.log('✅ PRODUÇÃO DETECTADA - Usando:', prodUrl);
    return prodUrl;
  }
  
  // LOCAL: Desenvolvimento
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const localUrl = 'http://localhost:3001';
    console.log('🔧 LOCAL DETECTADO - Usando:', localUrl);
    return localUrl;
  }
  
  // FALLBACK: Produção por padrão
  const fallbackUrl = 'https://boletos-backend-290725.vercel.app/api';
  console.log('🔄 FALLBACK - Usando:', fallbackUrl);
  return fallbackUrl;
};

export const buildApiUrl = (endpoint) => {
  const baseUrl = getCorrectApiUrl();
  const url = `${baseUrl}${endpoint}`;
  
  console.log('🔗 CONSTRUINDO URL:', {
    baseUrl,
    endpoint,
    finalUrl: url
  });
  
  return url;
};
```

### Frontend vercel.json - SPA Configuration
```json
{
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/"
    }
  ]
}
```

---

## 🚀 Processo de Deploy

### 1. Deploy do Backend
```bash
cd backend-bxc
npx vercel --prod
```

### 2. Deploy do Frontend
```bash
cd frontend
npx vercel --prod
```

### 3. Configuração no Dashboard Vercel

#### Backend Project Settings:
- **Framework Preset**: `Other`
- **Root Directory**: `backend-bxc`
- **Build Command**: `npm run build`
- **Output Directory**: (deixar vazio)

#### Frontend Project Settings:
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NODE_ENV=production

# Frontend (Vercel Dashboard)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
```

---

## 🔧 Troubleshooting

### Problema: 404 nas APIs
**Sintoma**: `404 NOT_FOUND` ao acessar `/api/*`

**Soluções:**
1. ✅ Verificar `vercel.json` está correto
2. ✅ Confirmar `module.exports` (não `export default`)
3. ✅ Verificar `package.json` sem `"type": "module"`

### Problema: CORS Errors
**Sintoma**: `Access-Control-Allow-Origin header is missing`

**Soluções:**
1. ✅ Adicionar headers CORS em **cada function**
2. ✅ Tratar `OPTIONS` requests (preflight)
3. ✅ Verificar headers estão sendo aplicados

```javascript
// ❌ Errado - Headers no vercel.json
{
  "headers": [...]  // Não funciona com Functions
}

// ✅ Correto - Headers na function
res.setHeader('Access-Control-Allow-Origin', '*');
```

### Problema: Build Failures
**Sintoma**: `npm error Missing script: "dev"`

**Soluções:**
1. ✅ Verificar diretório correto no Vercel Dashboard
2. ✅ Confirmar `package.json` tem scripts necessários
3. ✅ Verificar `Root Directory` está configurado

### Problema: Database Connection
**Sintoma**: `relation "usuarios" does not exist`

**Soluções:**
1. ✅ Verificar nome correto da tabela (`users` vs `usuarios`)
2. ✅ Confirmar connection string no `.env`
3. ✅ Testar conexão local primeiro

---

## 📊 Monitoramento e Logs

### Vercel Dashboard - Observability
1. **Functions**: Monitorar invocações e errors
2. **Analytics**: Performance e usage metrics
3. **Logs**: Real-time logging das functions

### Debug Local
```bash
# Backend
cd backend-bxc
vercel dev  # Simula ambiente Vercel localmente

# Frontend  
cd frontend
npm run dev
```

### Logs Estruturados
```javascript
// Em produção, usar logs estruturados
console.log('🚀 API Request:', {
  method: req.method,
  url: req.url,
  timestamp: new Date().toISOString(),
  uid: uid
});
```

---

## 🎯 Best Practices

### ✅ DO's

1. **Sempre** usar `module.exports` no backend
2. **Sempre** aplicar CORS headers nas functions
3. **Sempre** tratar `OPTIONS` requests
4. **Sempre** usar environment variables para secrets
5. **Sempre** fazer logs estruturados
6. **Sempre** testar localmente com `vercel dev`

### ❌ DON'Ts

1. **Nunca** usar `"type": "module"` no package.json
2. **Nunca** hardcodar URLs de API
3. **Nunca** expor secrets no código
4. **Nunca** fazer deploy sem testar localmente
5. **Nunca** esquecer de configurar CORS
6. **Nunca** usar `export default` nas functions

### Performance Tips

1. **Connection Pooling**: Reutilizar conexões de banco
2. **Caching**: Implementar cache quando possível
3. **Error Handling**: Sempre retornar responses adequados
4. **Monitoring**: Configurar alertas no Vercel

```javascript
// Exemplo de connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,           // Máximo de conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 📝 Comandos de Referência Rápida

```bash
# Deploy completo
git add .
git commit -m "🚀 Deploy: [descrição]"
git push origin develop

# Backend deploy
cd backend-bxc && npx vercel --prod

# Frontend deploy  
cd frontend && npx vercel --prod

# Debug local
cd backend-bxc && vercel dev
cd frontend && npm run dev

# Logs em tempo real
vercel logs [deployment-url] --follow

# Listar deployments
vercel ls
```

---

## 📞 Suporte e Manutenção

### Contacts
- **Developer**: BXC Team
- **Repository**: [GitHub Repository URL]
- **Vercel Dashboard**: [Dashboard URL]

### Emergency Procedures
1. **Rollback**: Use Vercel Dashboard → Deployments → Promote Previous
2. **Hotfix**: Deploy direto via CLI com `--prod`
3. **Database Issues**: Check Neon Dashboard primeiro

---

*Documento criado em: [Data Atual]*  
*Última atualização: [Data da Última Modificação]*  
*Versão: 1.0.0*