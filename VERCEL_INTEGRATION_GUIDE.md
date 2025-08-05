# 🚀 GUIA COMPLETO DE INTEGRAÇÃO VERCEL - BOLETOS-APP

## 📋 RESUMO EXECUTIVO

Este documento detalha todos os problemas encontrados e soluções implementadas durante a migração da aplicação Boletos-App do ambiente local para produção no Vercel. A aplicação era totalmente funcional localmente, mas apresentou diversos conflitos durante a integração.

---

## 🎯 PROBLEMAS PRINCIPAIS IDENTIFICADOS

### 1. **CORS (Cross-Origin Resource Sharing)**
- **Problema**: Frontend não conseguia se comunicar com backend
- **Erro**: `No 'Access-Control-Allow-Origin' header is present`
- **Causa**: Vercel Functions não aplicam headers globais do `vercel.json`

### 2. **Estrutura de Banco de Dados**
- **Problema**: Mismatch entre código e schema real
- **Erro**: `column "valor" does not exist`, `column "descricao" does not exist`
- **Causa**: Código usando nomes de colunas diferentes do banco

### 3. **Configuração Vercel**
- **Problema**: Deploy falhando, URLs mudando
- **Erro**: `Build failed`, `vercel command not found`
- **Causa**: Configurações incorretas no Dashboard

### 4. **Firebase Authentication**
- **Problema**: Login Google bloqueado
- **Erro**: `Tracking Prevention blocked access`, `Cross-Origin-Opener-Policy`
- **Causa**: Headers de segurança muito restritivos

### 5. **Wallet Connection**
- **Problema**: MetaMask não conectava
- **Erro**: `Cannot set property ethereum`
- **Causa**: Conflitos entre extensões de carteira

---

## 🔧 SOLUÇÕES IMPLEMENTADAS

### 1. **CORREÇÃO CORS - SOLUÇÃO DEFINITIVA**

#### **Problema**: Headers CORS não funcionavam via `vercel.json`

#### **Solução**: Adicionar headers em cada Serverless Function

```javascript
// Em TODAS as APIs (hello.js, perfil.js, boletos.js, etc.)
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
  
  // ... resto do código
};
```

#### **Arquivos Corrigidos**:
- `backend-bxc/api/hello.js`
- `backend-bxc/api/perfil.js`
- `backend-bxc/api/perfil/[uid].js`
- `backend-bxc/api/boletos.js`
- `backend-bxc/api/boletos/[id].js`
- `backend-bxc/api/boletos/usuario/[uid].js`

### 2. **ALINHAMENTO COM BANCO DE DADOS**

#### **Estrutura Real da Tabela `boletos`**:
```sql
CREATE TABLE boletos (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  valor_brl DECIMAL NOT NULL,
  valor_usdt DECIMAL NOT NULL,
  status VARCHAR NOT NULL,
  criado_em TIMESTAMP NOT NULL,
  cpf_cnpj VARCHAR,
  codigo_barras VARCHAR,
  vencimento DATE,
  instituicao VARCHAR,
  numero_controle VARCHAR,
  disputas INTEGER DEFAULT 0,
  transacoes INTEGER DEFAULT 0,
  comprovante_url VARCHAR,
  wallet_address VARCHAR,
  tx_hash VARCHAR
);
```

#### **Correções Implementadas**:

**Backend (`api/boletos.js`)**:
```javascript
// ANTES (ERRADO)
INSERT INTO boletos (numero_controle, valor, vencimento, user_id, descricao, ...)

// DEPOIS (CORRETO)
INSERT INTO boletos (
  numero_controle, valor_brl, valor_usdt, vencimento, user_id, 
  status, codigo_barras, cpf_cnpj, instituicao, criado_em
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
```

**Frontend (`VendedorPage.jsx`)**:
```javascript
// ANTES (ERRADO)
const boletoObj = {
  cpfCnpj: formData.cpfCnpj,
  codigoBarras: formData.codigoBarras,
  descricao: `Boleto ${formData.codigoBarras}`,
  // ...
};

// DEPOIS (CORRETO)
const boletoObj = {
  cpf_cnpj: formData.cpfCnpj,
  codigo_barras: formData.codigoBarras,
  valor: valorNum,
  user_id: user.uid,
  numero_controle: Date.now().toString(),
  instituicao: formData.instituicao,
  vencimento: formData.dataVencimento
};
```

### 3. **CONFIGURAÇÃO VERCEL CORRETA**

#### **Backend (`backend-bxc/vercel.json`)**:
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/perfil/(.*)",
      "destination": "/api/perfil/[uid]"
    },
    {
      "source": "/api/boletos/(.*)",
      "destination": "/api/boletos/[id]"
    },
    {
      "source": "/api/boletos/usuario/(.*)",
      "destination": "/api/boletos/usuario/[uid]"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

#### **Frontend (`frontend/vercel.json`)**:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Permissions-Policy",
          "value": "storage-access=*, camera=*, microphone=*, geolocation=*"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "unsafe-none"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### 4. **CORREÇÃO FIREBASE AUTHENTICATION**

#### **Problema**: `Cross-Origin-Opener-Policy policy would block`

#### **Solução**: Remover header restritivo

**Removido de `frontend/vercel.json`**:
```json
// REMOVIDO
{
  "key": "Cross-Origin-Opener-Policy",
  "value": "require-corp"
}
```

**Adicionado em `frontend/index.html`**:
```html
<meta name="referrer" content="no-referrer-when-downgrade" />
<meta http-equiv="Permissions-Policy" content="storage-access=*, camera=*, microphone=*, geolocation=*" />
```

### 5. **CORREÇÃO WALLET CONNECTION**

#### **Problema**: `MetaMask encountered an error setting the global Ethereum provider`

#### **Solução**: Configuração correta do RainbowKit

**`frontend/src/config/rainbowConfig.js`**:
```javascript
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygonMumbai],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'BXC Boletos App',
  projectId: 'YOUR_PROJECT_ID',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});
```

---

## 🛠️ CONFIGURAÇÕES DE DEPLOY

### **Backend Deploy**:
```bash
cd backend-bxc
npx vercel --prod
```

### **Frontend Deploy**:
```bash
cd frontend
npx vercel --prod
```

### **URLs Finais**:
- **Backend**: `https://boletos-backend-290725.vercel.app/api`
- **Frontend**: `https://boletos-app-mocha.vercel.app`

---

## 🔍 DEBUGGING E TESTES

### **Teste Backend**:
```powershell
# Teste básico
Invoke-RestMethod -Uri "https://boletos-backend-290725.vercel.app/api/hello"

# Teste criação de boleto
Invoke-RestMethod -Uri "https://boletos-backend-290725.vercel.app/api/boletos" -Method POST -ContentType "application/json" -Body '{"numero_controle":"TEST123","valor":100.50,"user_id":"jo2px7rqi9ei9G5fvZ0bq2bFoh33","codigo_barras":"123456789012345678901234567890","cpf_cnpj":"12345678901","instituicao":"Teste"}'
```

### **Logs Vercel**:
```bash
npx vercel logs
```

---

## 📚 LIÇÕES APRENDIDAS

### 1. **Vercel Functions vs Express**
- Vercel Functions são Serverless, não Express
- Headers CORS devem ser adicionados em cada função
- Não usar middleware global

### 2. **Database Schema**
- Sempre verificar estrutura real do banco
- Usar nomes corretos das colunas
- Respeitar constraints (NOT NULL, etc.)

### 3. **Frontend-Backend Communication**
- URLs devem ser consistentes
- Payload deve corresponder ao esperado pelo backend
- Tratar erros adequadamente

### 4. **Security Headers**
- Headers muito restritivos podem quebrar funcionalidades
- Testar cada header individualmente
- Balancear segurança com funcionalidade

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **Erro 500 - Database Connection**:
```bash
# Verificar DATABASE_URL no Vercel Dashboard
# Garantir que SSL está configurado
```

### **Erro 400 - Bad Request**:
```bash
# Verificar payload do frontend
# Confirmar nomes das colunas no banco
```

### **Erro CORS**:
```bash
# Adicionar headers em cada API function
# Verificar preflight OPTIONS
```

### **Erro Firebase Auth**:
```bash
# Verificar URLs autorizadas no Firebase Console
# Remover headers restritivos
```

---

## 📝 CHECKLIST DE DEPLOY

### **Antes do Deploy**:
- [ ] Testar localmente com `npx vercel dev`
- [ ] Verificar estrutura do banco
- [ ] Confirmar URLs das APIs
- [ ] Testar CORS localmente

### **Durante o Deploy**:
- [ ] Deploy backend primeiro
- [ ] Testar APIs individualmente
- [ ] Deploy frontend
- [ ] Testar integração completa

### **Após o Deploy**:
- [ ] Testar login Google
- [ ] Testar conexão wallet
- [ ] Testar CRUD de boletos
- [ ] Verificar logs de erro

---

## 🔄 MANUTENÇÃO FUTURA

### **Atualizações de Código**:
1. Fazer alterações localmente
2. Testar com `npx vercel dev`
3. Commit e push para GitHub
4. Deploy automático via Vercel

### **Monitoramento**:
- Usar Vercel Analytics
- Monitorar logs de erro
- Verificar performance

### **Backup**:
- Manter backup do banco
- Versionar configurações
- Documentar mudanças

---

## 📞 SUPORTE

### **Comandos Úteis**:
```bash
# Ver logs
npx vercel logs

# Deploy específico
npx vercel --prod

# Teste local
npx vercel dev

# Ver configurações
npx vercel env ls
```

### **Recursos**:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Última atualização**: Agosto 2025  
**Versão**: 1.0.0  
**Status**: ✅ PRODUÇÃO FUNCIONAL 