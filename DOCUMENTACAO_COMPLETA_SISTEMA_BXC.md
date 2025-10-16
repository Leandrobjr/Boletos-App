# 📚 DOCUMENTAÇÃO COMPLETA - SISTEMA BXC BOLETOS

## 🎯 **VISÃO GERAL DO SISTEMA**

O **BXC Boletos** é uma plataforma descentralizada para compra e venda de boletos bancários usando USDT como meio de pagamento, implementada na blockchain Polygon Amoy (testnet). O sistema utiliza smart contracts para garantir transações seguras através de um mecanismo de escrow.

---

## 🏗️ **ARQUITETURA DO SISTEMA**

### **Stack Tecnológico Completo:**

#### **Frontend:**
- **React** 18.2.0 - Framework principal
- **Vite** - Build tool e desenvolvimento
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes de interface
- **Ethers.js** 6.15.0 - Interação com blockchain
- **Firebase** - Autenticação e persistência
- **React Router** - Navegação

#### **Backend:**
- **Node.js** - Runtime
- **Express.js** - Framework de API
- **PostgreSQL** - Banco de dados (produção)
- **JSON Local Storage** - Persistência desenvolvimento

#### **Blockchain:**
- **Solidity** ^0.8.20 - Linguagem dos contratos
- **Hardhat** - Framework de desenvolvimento
- **OpenZeppelin** - Bibliotecas de segurança
- **Polygon Amoy** - Rede testnet (Chain ID: 80002)

---

## 📋 **SMART CONTRACTS IMPLEMENTADOS**

### **1. MockUSDT.sol**
```solidity
// Endereço: 0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD
contract MockUSDT is ERC20, Ownable, Pausable
```

**Funcionalidades:**
- Token ERC20 de teste (6 decimais)
- Mint/burn controlado pelo owner
- Sistema pausável para emergências
- Total supply inicial: 1,000,000 USDT

**Métodos Principais:**
```solidity
function mint(address to, uint256 amount) external onlyOwner
function burn(uint256 amount) external
function pause() external onlyOwner
function unpause() external onlyOwner
```

### **2. P2PEscrowEnhanced.sol**
```solidity
// Endereço: 0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2
contract P2PEscrowEnhanced is ReentrancyGuard, Ownable, Pausable
```

**Estrutura de Dados:**
```solidity
struct EnhancedEscrow {
    address seller;           // Vendedor
    address buyer;           // Comprador
    uint256 boletoValue;     // Valor do boleto
    uint256 sellerFee;       // Taxa do vendedor (2%)
    uint256 buyerFee;        // Taxa do comprador (4%)
    uint256 createdAt;       // Timestamp de criação
    uint256 uploadDeadline;  // Prazo para upload
    uint256 autoReleaseTime; // Liberação automática
    bool isActive;           // Status ativo
    bool isReleased;         // Status liberado
    bool isDisputed;         // Status de disputa
    bool uploadeado;         // Comprovante enviado
    EscrowStatus status;     // Status detalhado
}
```

**Sistema de Taxas Dinâmicas:**
```solidity
// Taxas fixas
uint256 public constant SELLER_FEE_PERCENTAGE = 200; // 2%
uint256 public constant BUYER_BASE_FEE = 4 * 10**6;  // 4 USDT

// Prazos para reembolso de taxas
uint256 public constant FULL_REFUND_PERIOD = 1 hours;
uint256 public constant HALF_REFUND_PERIOD = 6 hours;
uint256 public constant QUARTER_REFUND_PERIOD = 24 hours;
```

**Fluxo de Transação:**
1. **Vendedor:** `createEnhancedEscrow()` - cria escrow + transfere USDT
2. **Comprador:** Reserva via backend (não interage diretamente)
3. **Vendedor:** `registerBuyer()` - registra comprador no contrato
4. **Vendedor:** `approvePayment()` - libera USDT para comprador

---

## 🔧 **COMPONENTES FRONTEND PRINCIPAIS**

### **1. Hook Principal: useBoletoEscrowFixed.js**
```javascript
// Localização: frontend/src/hooks/useBoletoEscrowFixed.js
// Responsável por toda interação com blockchain
```

**Configuração de Contratos:**
```javascript
const DEV_CONFIG = {
  MOCK_USDT: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
  P2P_ESCROW: '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2',
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology'
  }
};
```

**Funções Exportadas:**
```javascript
{
  connectWallet,           // Conectar carteira
  disconnectWallet,        // Desconectar carteira
  createEscrowForSeller,   // Criar escrow (vendedor)
  registerBuyer,           // Registrar comprador
  releaseEscrow,           // Liberar pagamento
  isLoading,              // Estado de carregamento
  error,                  // Erros
  isConnected,            // Status conexão
  address,                // Endereço conectado
  networkCorrect          // Rede correta
}
```

### **2. Sistema de Refresh de Saldos: BalanceRefresher.jsx**
```javascript
// Localização: frontend/src/components/BalanceRefresher.jsx
// Refresh automático a cada 30 segundos
```

**Funcionalidades:**
- Consulta saldo direto via RPC (bypass cache)
- Detecção automática Rabby vs MetaMask
- Refresh silencioso de carteiras
- Modo background invisível

**Integração:**
```jsx
<BalanceRefresher address={address} isBackgroundMode={true} />
```

### **3. Páginas Principais**

#### **VendedorPage.jsx**
- **Rota:** `/vendedor`
- **Funcionalidades:**
  - Cadastro de boletos
  - Listagem de boletos criados
  - Aprovação de compradores
  - Liberação de pagamentos

#### **CompradorPage.jsx**
- **Rota:** `/comprador`
- **Funcionalidades:**
  - Busca de boletos disponíveis
  - Reserva de boletos
  - Upload de comprovantes
  - Histórico de compras

---

## 🛣️ **ROTAS E ENDPOINTS API**

### **Rotas Frontend (React Router):**
```javascript
// Localização: frontend/src/App.jsx
/                    → Página inicial
/vendedor           → Portal do vendedor
/comprador          → Portal do comprador
/gestao             → Gestão administrativa
/confirmacao-compra → Confirmação de transação
```

### **Endpoints Backend:**

#### **Boletos:**
```javascript
// Base URL: http://localhost:3001

// Criação de boletos
POST /api/boletos
Body: {
  user_id, cpf_cnpj, codigo_barras, valor, 
  valor_usdt, vencimento, instituicao, 
  numero_controle, escrow_id, tx_hash
}

// Listagem por usuário
GET /api/boletos/usuario/:userId

// Reservar boleto (comprador)
PATCH /boletos/controle/:numeroControle/reservar
Body: { user_id, wallet_address, tx_hash }

// Baixar boleto (vendedor)
PATCH /boletos/:numeroControle/baixar
Body: { 
  user_id, wallet_address_vendedor, 
  wallet_address_comprador, tx_hash 
}

// Upload de comprovante
POST /boletos/:numeroControle/comprovante
Body: FormData com arquivo

// Consulta de taxas em tempo real
GET /api/taxas/:numeroControle

// Estatísticas do sistema
GET /api/sistema/stats
```

---

## ⚙️ **SISTEMA DE TAXAS DINÂMICAS**

### **Implementação Backend:**

#### **DynamicFeeService.js**
```javascript
// Localização: src/services/DynamicFeeService.js

class DynamicFeeService {
  calculateBuyerFee(boletoValue) {
    // Taxa fixa de 4 USDT para qualquer valor
    return {
      amount: 4.0,
      type: 'FIXED',
      description: 'Taxa fixa do comprador'
    };
  }

  calculateSellerFee(boletoValue) {
    // 2% do valor do boleto
    const fee = boletoValue * 0.02;
    return {
      baseFee: fee,
      currentFee: fee,
      refundAmount: 0,
      percentage: 2
    };
  }

  getSellerRefundAmount(creationTime, originalFee) {
    const elapsed = Date.now() - creationTime;
    const oneHour = 60 * 60 * 1000;
    
    if (elapsed <= oneHour) {
      return originalFee; // 100% refund
    } else if (elapsed <= 6 * oneHour) {
      return originalFee * 0.5; // 50% refund
    } else if (elapsed <= 24 * oneHour) {
      return originalFee * 0.25; // 25% refund
    } else {
      return 0; // No refund
    }
  }
}
```

#### **TimerService.js**
```javascript
// Localização: src/services/TimerService.js

class TimerService {
  createTransactionTimers(numeroControle, boletoData) {
    const uploadDeadline = Date.now() + (60 * 60 * 1000); // 1 hora
    const autoReleaseTime = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
    
    // Criar timers para upload e liberação automática
    this.scheduleUploadReminder(numeroControle, uploadDeadline);
    this.scheduleAutoRelease(numeroControle, autoReleaseTime);
  }
}
```

---

## 🔐 **SEGURANÇA E BOAS PRÁTICAS**

### **Smart Contract Security:**
- **ReentrancyGuard:** Proteção contra ataques de reentrância
- **Ownable:** Controle de acesso administrativo
- **Pausable:** Pausa de emergência
- **Custom Errors:** Economia de gas e melhor debugging

### **Frontend Security:**
- **Input Validation:** Validação de dados de entrada
- **Error Handling:** Tratamento robusto de erros
- **Network Validation:** Verificação de rede correta
- **Wallet Security:** Conexão segura com carteiras

### **OWASP Compliance:**
- **Input Sanitization:** Sanitização de entradas
- **SQL Injection Prevention:** Queries parametrizadas
- **XSS Protection:** Escape de dados
- **CSRF Protection:** Tokens de proteção
- **Authentication:** Sistema Firebase seguro

---

## 🔄 **FLUXO COMPLETO DE TRANSAÇÃO**

### **1. Criação de Boleto (Vendedor):**
```mermaid
Vendedor → Frontend → Smart Contract → Backend
1. Conecta carteira
2. Preenche dados do boleto
3. Aprova USDT (valor + 2% taxa)
4. Chama createEnhancedEscrow()
5. Salva no banco de dados
```

### **2. Reserva de Boleto (Comprador):**
```mermaid
Comprador → Frontend → Backend
1. Conecta carteira
2. Busca boletos disponíveis
3. Seleciona boleto
4. Reserva via API (sem blockchain)
```

### **3. Liberação de Pagamento (Vendedor):**
```mermaid
Vendedor → Frontend → Smart Contract → Backend
1. Visualiza comprovante
2. Chama registerBuyer()
3. Chama approvePayment()
4. USDT transferido para comprador
5. Status atualizado no backend
```

---

## 📊 **ESTRUTURA DE DADOS**

### **Banco de Dados (Backend):**
```javascript
// Estrutura do boleto
{
  id: "timestamp_unique",
  user_id: "firebase_uid",
  cpf_cnpj: "documento",
  codigo_barras: "codigo_48_digitos",
  valor: 1000.50,           // Valor BRL
  valor_usdt: 186.24,       // Valor convertido
  vencimento: "2025-12-31",
  instituicao: "banco_nome",
  numero_controle: "controle_unico",
  escrow_id: "0x...",       // ID do smart contract
  tx_hash: "0x...",         // Hash da transação
  wallet_address: "0x...",  // Endereço do comprador
  comprovante_url: "url",   // URL do comprovante
  status: "DISPONIVEL",     // Status atual
  
  // Taxas dinâmicas
  buyer_fee: 4.0,
  seller_transaction_fee: 20.0,
  current_seller_fee: 15.0,
  seller_refund_amount: 5.0,
  buyer_total_cost: 190.24,
  seller_receives: 166.24,
  protocol_earnings: 24.0,
  
  // Timestamps
  data_criacao: "2025-09-26T10:00:00Z",
  data_travamento: "2025-09-26T11:00:00Z",
  data_liberacao: "2025-09-26T12:00:00Z"
}
```

---

## 🚀 **DEPLOY E CONFIGURAÇÃO**

### **Contratos Deployados (Amoy Testnet):**
```javascript
{
  "network": "Polygon Amoy",
  "chainId": 80002,
  "rpcUrl": "https://rpc-amoy.polygon.technology",
  "contracts": {
    "MockUSDT": "0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD",
    "P2PEscrowEnhanced": "0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2"
  },
  "owner": "0x9950764Ad4548E9106E3106c954a87D8b3CF64a7",
  "deployer": "0xEd6e7b900d941De731003E259455c1C1669E9956"
}
```

### **Scripts de Deploy:**
```bash
# Deploy dos contratos
npx hardhat run scripts/deploy-enhanced.ts --network amoy

# Verificação no PolygonScan
npx hardhat verify 0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2 --network amoy

# Transfer de USDT para testes
npx hardhat run scripts/transfer-usdt.ts --network amoy
```

### **Configuração do Frontend:**
```javascript
// frontend/src/hooks/useBoletoEscrowFixed.js
const DEV_CONFIG = {
  MOCK_USDT: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
  P2P_ESCROW: '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2',
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology'
  }
};
```

---

## 🧪 **TESTING E DEBUGGING**

### **Comandos de Teste:**
```bash
# Testar contratos
npx hardhat test

# Verificar saldos
npx hardhat run scripts/check-balances.js --network amoy

# Verificar fluxo USDT
npx hardhat run scripts/check-usdt-flow.js --network amoy
```

### **Debug de Transações:**
```javascript
// Logs do sistema (desenvolvimento)
console.log('🔄 [FIXED] Criando escrow aprimorado');
console.log('💰 [FIXED] Aprovando USDT');
console.log('✅ [FIXED] Escrow criado com sucesso');
console.log('🔄 [FIXED] Registrando comprador');
console.log('✅ [FIXED] Pagamento liberado');
```

---

## 📈 **MONITORAMENTO E MÉTRICAS**

### **Endpoint de Estatísticas:**
```javascript
GET /api/sistema/stats
Response: {
  totalBoletos: 150,
  boletosAtivos: 25,
  volumeTotal: 50000.00,
  volumeUSDT: 9302.33,
  taxasColetadas: 186.05,
  transacoesHoje: 12,
  usuariosAtivos: 45
}
```

### **Logs de Sistema:**
- Criação de escrows
- Registros de compradores
- Liberações de pagamento
- Refresh de saldos
- Erros de rede/carteira

---

## 🔧 **TROUBLESHOOTING COMUM**

### **Problemas de Carteira:**
1. **Saldo não atualiza:** Sistema de refresh automático resolve
2. **Rede incorreta:** Hook detecta e solicita mudança
3. **Permissões:** Reconexão automática via `wallet_requestPermissions`

### **Problemas de Contrato:**
1. **"Escrow not active":** Verificar se escrow já foi liberado
2. **"Transfer to zero address":** Garantir que `registerBuyer` foi chamado
3. **"Insufficient allowance":** Verificar aprovação de USDT

### **Problemas de API:**
1. **404 boleto não encontrado:** Verificar `numero_controle`
2. **500 erro interno:** Verificar logs do servidor
3. **Timeout:** Verificar conectividade blockchain

---

## 📝 **CHANGELOG E VERSÕES**

### **v2.0.0 - Enhanced System (Atual)**
- ✅ Implementação do `P2PEscrowEnhanced`
- ✅ Sistema de taxas dinâmicas
- ✅ Refresh automático de saldos
- ✅ Suporte completo Rabby Wallet
- ✅ API REST completa
- ✅ Sistema de timers automáticos

### **v1.0.0 - MVP Original**
- ✅ `P2PEscrow` básico
- ✅ Frontend React
- ✅ Integração MetaMask
- ✅ Backend Node.js

---

## 🎯 **PRÓXIMAS IMPLEMENTAÇÕES**

### **Roadmap Técnico:**
1. **Sistema de Disputas** - Arbitragem descentralizada
2. **Multi-token Support** - USDC, DAI, outros stablecoins
3. **Layer 2 Integration** - Polygon mainnet, Arbitrum
4. **Mobile App** - React Native
5. **Analytics Dashboard** - Métricas avançadas

### **Melhorias de Performance:**
1. **Caching Inteligente** - Redis para dados frequentes
2. **Lazy Loading** - Componentes sob demanda
3. **Batch Transactions** - Múltiplas operações em uma tx
4. **GraphQL Integration** - Queries otimizadas

---

## 📞 **SUPORTE E MANUTENÇÃO**

### **Logs de Sistema:**
- **Frontend:** Console do navegador
- **Backend:** Arquivo `server.log`
- **Blockchain:** PolygonScan Amoy

### **Configuração de Desenvolvimento:**
```bash
# Iniciar backend
cd backend && npm run dev

# Iniciar frontend
cd frontend && npm run dev

# Iniciar node Hardhat local
npx hardhat node
```

### **Monitoramento de Contratos:**
- **PolygonScan:** https://amoy.polygonscan.com/
- **Endereço P2PEscrow:** `0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2`
- **Endereço MockUSDT:** `0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD`

---

## 🔒 **CONSIDERAÇÕES DE SEGURANÇA FINAIS**

### **Auditoria de Contratos:**
- ✅ Proteção contra reentrância
- ✅ Validação de parâmetros
- ✅ Controle de acesso
- ✅ Pausa de emergência
- ✅ Teste de edge cases

### **Segurança do Frontend:**
- ✅ Validação de input
- ✅ Sanitização de dados
- ✅ Tratamento de erros
- ✅ Proteção XSS
- ✅ Autenticação Firebase

### **Segurança da API:**
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ CORS configurado
- ✅ HTTPS em produção

---

**Documentação atualizada em:** Setembro 2025  
**Versão do sistema:** 2.0.0 Enhanced  
**Autor:** Equipe de Desenvolvimento BXC  
**Status:** ✅ Produção (Testnet)

