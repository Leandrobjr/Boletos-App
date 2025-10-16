# 📋 DOCUMENTAÇÃO TÉCNICA - CONTRATOS INTELIGENTES BoletoXCrypto

## 🎯 **VISÃO GERAL**

Este documento fornece especificações técnicas completas para implementação dos contratos inteligentes do sistema BoletoXCrypto em ambiente de produção. O sistema atual utiliza Polygon Amoy (testnet) e deve ser migrado para Polygon Mainnet com integração ao banco de dados Neon PostgreSQL.

---

## 📊 **ARQUITETURA DO SISTEMA**

### **Componentes Principais:**
1. **MockUSDT** - Token ERC-20 para transações
2. **P2PEscrow** - Contrato de escrow para garantia de pagamentos
3. **Frontend React** - Interface de usuário
4. **Backend Node.js** - API REST com PostgreSQL
5. **MetaMask** - Integração com carteiras

### **Fluxo de Dados:**
```
Frontend → Wallet (MetaMask) → Smart Contracts → Backend API → PostgreSQL
```

---

## 🏗️ **CONTRATOS INTELIGENTES**

### **1. MockUSDT (Token ERC-20)**

#### **Especificações:**
- **Padrão:** ERC-20
- **Nome:** Mock USDT
- **Símbolo:** USDT
- **Decimais:** 6
- **Supply:** Configurável (atual: 1.000.000 USDT)

#### **Funcionalidades:**
```solidity
// Funções principais
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)
function balanceOf(address account) external view returns (uint256)
```

#### **Endereço Atual (Amoy):**
```
0xB160a30D1612756AF9F6498d47384638D73b953e
```

### **2. P2PEscrow (Contrato Principal)**

#### **Especificações:**
- **Padrão:** Contrato customizado com OpenZeppelin
- **Taxa:** 2% sobre o valor do boleto
- **Segurança:** ReentrancyGuard, Pausable, Ownable

#### **Estrutura de Dados:**
```solidity
struct Escrow {
    address seller;      // Vendedor do boleto
    address buyer;       // Comprador do boleto
    uint256 amount;      // Valor líquido (sem taxa)
    uint256 fee;         // Taxa (2%)
    uint256 boletoId;    // ID do boleto
    bool isActive;       // Status ativo
    bool isReleased;     // Status liberado
}
```

#### **Funções Principais:**
```solidity
// Criar escrow (vendedor)
function createEscrow(uint256 _boletoId, uint256 _amount, address _buyer) external

// Registrar comprador
function registerBuyer(uint256 _boletoId, address _buyer) external

// Aprovar pagamento (vendedor)
function approvePayment(bytes32 _escrowId) external

// Cancelar escrow (vendedor)
function cancelEscrow(bytes32 _escrowId) external

// Liberar escrow (owner - disputas)
function releaseEscrow(bytes32 _escrowId) external onlyOwner
```

#### **Eventos:**
```solidity
event EscrowCreated(bytes32 indexed escrowId, address indexed seller, uint256 boletoId, uint256 amount, uint256 fee)
event EscrowReleased(bytes32 indexed escrowId, address indexed seller, address indexed buyer, uint256 amount, uint256 fee)
event EscrowCancelled(bytes32 indexed escrowId, address indexed seller, uint256 amount, uint256 fee)
event BuyerRegistered(uint256 indexed boletoId, address indexed buyer)
```

#### **Endereço Atual (Amoy):**
```
0x07A09cC7ecB7Ea93d85A225Be2aCb61aE0738Fbf
```

---

## 🔧 **CONFIGURAÇÃO DE DEPLOYMENT**

### **1. Hardhat Configuration**

#### **hardhat.config.ts:**
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // TESTNET (Atual)
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 80002
    },
    // PRODUÇÃO (Polygon Mainnet)
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.PRIVATE_KEY_PROD!],
      chainId: 137,
      gasPrice: 30000000000 // 30 gwei
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY!,
      polygonAmoy: process.env.POLYGONSCAN_API_KEY!
    }
  }
};
```

### **2. Script de Deploy**

#### **scripts/deploy-production.ts:**
```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying to Polygon Mainnet...");
  
  // 1. Deploy MockUSDT (ou usar USDT real)
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("📄 MockUSDT deployed to:", mockUSDTAddress);
  
  // 2. Deploy P2PEscrow
  const P2PEscrow = await ethers.getContractFactory("P2PEscrow");
  const p2pEscrow = await P2PEscrow.deploy(mockUSDTAddress);
  await p2pEscrow.waitForDeployment();
  
  // 3. Verificar se o deployer é o owner correto
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer address:", deployer.address);
  console.log("👑 Expected fee collector:", "0x9950764Ad4548E9106E3106c954a87D8b3CF64a7");
  
  // IMPORTANTE: Se o deployer não for a carteira de taxa, transferir ownership
  if (deployer.address.toLowerCase() !== "0x9950764Ad4548E9106E3106c954a87D8b3CF64a7".toLowerCase()) {
    console.log("⚠️  Transferindo ownership para carteira de taxa...");
    await p2pEscrow.transferOwnership("0x9950764Ad4548E9106E3106c954a87D8b3CF64a7");
    console.log("✅ Ownership transferido!");
  }
  
  const p2pEscrowAddress = await p2pEscrow.getAddress();
  console.log("🔒 P2PEscrow deployed to:", p2pEscrowAddress);
  
  // 4. Verificar contratos
  console.log("🔍 Verifying contracts...");
  
  await hre.run("verify:verify", {
    address: mockUSDTAddress,
    constructorArguments: []
  });
  
  await hre.run("verify:verify", {
    address: p2pEscrowAddress,
    constructorArguments: [mockUSDTAddress]
  });
  
  // 5. Salvar endereços
  const addresses = {
    network: "polygon",
    chainId: 137,
    mockUSDT: mockUSDTAddress,
    p2pEscrow: p2pEscrowAddress,
    feeCollectorWallet: "0x9950764Ad4548E9106E3106c954a87D8b3CF64a7",
    deployedAt: new Date().toISOString()
  };
  
  console.log("📋 Deployment Summary:", addresses);
}
```

---

## 🌐 **CONFIGURAÇÃO DE REDE**

### **Polygon Mainnet (Produção):**
```javascript
const PRODUCTION_CONFIG = {
  NETWORK: {
    id: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com'
  },
  // Endereços serão definidos após deploy
  MOCK_USDT: 'TBD_AFTER_DEPLOY',
  P2P_ESCROW: 'TBD_AFTER_DEPLOY',
  // Carteira do aplicativo para receber taxas
  FEE_COLLECTOR_WALLET: '0x9950764Ad4548E9106E3106c954a87D8b3CF64a7'
};
```

### **Polygon Amoy (Desenvolvimento):**
```javascript
const DEV_CONFIG = {
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com'
  },
  MOCK_USDT: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
  P2P_ESCROW_ENHANCED: '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2',
  // Carteira do aplicativo para receber taxas (mesma para dev e prod)
  FEE_COLLECTOR_WALLET: '0x9950764Ad4548E9106E3106c954a87D8b3CF64a7'
};
```

---

## 🔌 **INTEGRAÇÃO FRONTEND**

### **1. Hook Principal (useBoletoEscrow.js)**

#### **Estrutura Base:**
```javascript
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

const useBoletoEscrow = (environment = 'production') => {
  const CONFIG = environment === 'production' ? PRODUCTION_CONFIG : DEV_CONFIG;
  
  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Funções principais
  const connectWallet = useCallback(async () => { /* ... */ });
  const createEscrow = useCallback(async (formData) => { /* ... */ });
  const releaseEscrow = useCallback(async ({ escrowId }) => { /* ... */ });
  const registerBuyer = useCallback(async (boletoId) => { /* ... */ });
  
  return {
    isConnected,
    address,
    isLoading,
    connectWallet,
    createEscrow,
    releaseEscrow,
    registerBuyer
  };
};
```

#### **Função createEscrow (Vendedor):**
```javascript
const createEscrow = useCallback(async (formData) => {
  try {
    setIsLoading(true);
    
    // 1. Conectar com provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // 2. Calcular valores
    const valorUsdt = parseFloat(formData.valorUSDT || formData.valorUsdt || 100);
    const fee = valorUsdt * 0.02; // 2%
    const totalAmount = valorUsdt + fee;
    
    // 3. Instanciar contratos
    const mockUSDT = new ethers.Contract(CONFIG.MOCK_USDT, MOCK_USDT_ABI, signer);
    const p2pEscrow = new ethers.Contract(CONFIG.P2P_ESCROW, P2P_ESCROW_ABI, signer);
    
    // 4. Aprovar USDT
    const amount = ethers.parseUnits(totalAmount.toFixed(6), 6);
    const approveTx = await mockUSDT.approve(CONFIG.P2P_ESCROW, amount);
    await approveTx.wait();
    
    // 5. Criar escrow
    const boletoId = Date.now();
    const createTx = await p2pEscrow.createEscrow(
      boletoId,
      ethers.parseUnits(valorUsdt.toFixed(6), 6),
      address // buyer temporário
    );
    
    const receipt = await createTx.wait();
    
    // 6. Extrair escrow ID dos eventos
    const escrowId = extractEscrowIdFromLogs(receipt.logs);
    
    return {
      success: true,
      txHash: createTx.hash,
      approveTxHash: approveTx.hash,
      escrowId,
      boletoId
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    setIsLoading(false);
  }
}, [CONFIG, address]);
```

#### **Função releaseEscrow (Vendedor):**
```javascript
const releaseEscrow = useCallback(async ({ escrowId }) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Verificar status do escrow
    const p2pEscrowRead = new ethers.Contract(CONFIG.P2P_ESCROW, P2P_ESCROW_READ_ABI, provider);
    const escrowData = await p2pEscrowRead.escrows(escrowId);
    
    // Se já foi liberado, retornar sucesso
    if (escrowData[6]) { // isReleased
      return { success: true, txHash: 'already-released', alreadyReleased: true };
    }
    
    // Se não está ativo, erro
    if (!escrowData[5]) { // isActive
      return { success: false, error: 'Escrow não está ativo' };
    }
    
    // Aprovar pagamento
    const p2pEscrow = new ethers.Contract(CONFIG.P2P_ESCROW, ['function approvePayment(bytes32 escrowId) external'], signer);
    const approveTx = await p2pEscrow.approvePayment(escrowId);
    await approveTx.wait();
    
    return { success: true, txHash: approveTx.hash };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}, [CONFIG]);
```

### **2. ABIs dos Contratos**

#### **MockUSDT ABI:**
```javascript
const MOCK_USDT_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];
```

#### **P2PEscrow ABI:**
```javascript
const P2P_ESCROW_ABI = [
  'function createEscrow(uint256 _boletoId, uint256 _amount, address _buyer) external',
  'function approvePayment(bytes32 _escrowId) external',
  'function cancelEscrow(bytes32 _escrowId) external',
  'function registerBuyer(uint256 _boletoId, address _buyer) external',
  'function escrows(bytes32) external view returns (uint256 boletoId, address seller, address buyer, uint256 amount, uint256 fee, bool isActive, bool isReleased)',
  'event EscrowCreated(bytes32 indexed escrowId, address indexed seller, uint256 boletoId, uint256 amount, uint256 fee)',
  'event EscrowReleased(bytes32 indexed escrowId, address indexed seller, address indexed buyer, uint256 amount, uint256 fee)'
];
```

---

## 🗄️ **INTEGRAÇÃO COM BACKEND**

### **1. Estrutura do Banco de Dados**

#### **Tabela: boletos (Atualizada)**
```sql
CREATE TABLE boletos (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL,
    codigo_barras VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    valor_usdt DECIMAL(18,6), -- Novo campo
    vencimento DATE NOT NULL,
    instituicao VARCHAR(100) NOT NULL,
    numero_controle VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'DISPONIVEL',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_travamento TIMESTAMP,
    comprador_id VARCHAR(255),
    comprovante_url TEXT,
    -- Campos blockchain (NOVOS)
    escrow_id VARCHAR(66), -- Hash do escrow (0x...)
    tx_hash VARCHAR(66), -- Hash da transação de criação
    approve_tx_hash VARCHAR(66), -- Hash da transação de approve
    wallet_address_vendedor VARCHAR(42), -- Endereço da carteira do vendedor
    wallet_address_comprador VARCHAR(42), -- Endereço da carteira do comprador
    blockchain_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACTIVE, RELEASED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_boletos_escrow_id ON boletos(escrow_id);
CREATE INDEX idx_boletos_tx_hash ON boletos(tx_hash);
CREATE INDEX idx_boletos_wallet_vendedor ON boletos(wallet_address_vendedor);
CREATE INDEX idx_boletos_blockchain_status ON boletos(blockchain_status);
```

#### **Tabela: escrow_events (Nova)**
```sql
CREATE TABLE escrow_events (
    id SERIAL PRIMARY KEY,
    escrow_id VARCHAR(66) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- CREATED, RELEASED, CANCELLED
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT,
    seller_address VARCHAR(42),
    buyer_address VARCHAR(42),
    amount DECIMAL(18,6),
    fee DECIMAL(18,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_events_escrow_id ON escrow_events(escrow_id);
CREATE INDEX idx_escrow_events_tx_hash ON escrow_events(tx_hash);
```

### **2. Endpoints da API**

#### **POST /api/boletos (Atualizado)**
```javascript
app.post('/api/boletos', async (req, res) => {
  try {
    const {
      user_id,
      cpf_cnpj,
      codigo_barras,
      valor,
      valor_usdt,
      vencimento,
      instituicao,
      numero_controle,
      // Campos blockchain
      escrow_id,
      tx_hash,
      approve_tx_hash,
      wallet_address_vendedor
    } = req.body;

    const query = `
      INSERT INTO boletos (
        user_id, cpf_cnpj, codigo_barras, valor, valor_usdt,
        vencimento, instituicao, numero_controle,
        escrow_id, tx_hash, approve_tx_hash, wallet_address_vendedor,
        blockchain_status, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE', 'DISPONIVEL')
      RETURNING *
    `;

    const values = [
      user_id, cpf_cnpj, codigo_barras, valor, valor_usdt,
      vencimento, instituicao, numero_controle,
      escrow_id, tx_hash, approve_tx_hash, wallet_address_vendedor
    ];

    const result = await pool.query(query, values);
    
    // Registrar evento no blockchain
    await registerEscrowEvent({
      escrow_id,
      event_type: 'CREATED',
      tx_hash,
      seller_address: wallet_address_vendedor,
      amount: valor_usdt,
      fee: valor_usdt * 0.02
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

#### **PATCH /boletos/:numeroControle/baixar (Atualizado)**
```javascript
app.patch('/boletos/:numeroControle/baixar', async (req, res) => {
  try {
    const { numeroControle } = req.params;
    const { 
      user_id, 
      wallet_address_vendedor, 
      tx_hash,
      buyer_address 
    } = req.body;

    // Verificar se o boleto existe e pertence ao usuário
    const checkQuery = `
      SELECT * FROM boletos 
      WHERE numero_controle = $1 AND user_id = $2 AND status = 'AGUARDANDO BAIXA'
    `;
    const checkResult = await pool.query(checkQuery, [numeroControle, user_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado ou não pode ser baixado' });
    }

    const boleto = checkResult.rows[0];

    // Atualizar status do boleto
    const updateQuery = `
      UPDATE boletos 
      SET status = 'BAIXADO', 
          blockchain_status = 'RELEASED',
          wallet_address_comprador = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE numero_controle = $2
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [buyer_address, numeroControle]);

    // Registrar evento de liberação
    await registerEscrowEvent({
      escrow_id: boleto.escrow_id,
      event_type: 'RELEASED',
      tx_hash,
      seller_address: wallet_address_vendedor,
      buyer_address,
      amount: boleto.valor_usdt,
      fee: boleto.valor_usdt * 0.02
    });

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao baixar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

#### **Função auxiliar: registerEscrowEvent**
```javascript
async function registerEscrowEvent(eventData) {
  const {
    escrow_id,
    event_type,
    tx_hash,
    seller_address,
    buyer_address,
    amount,
    fee,
    block_number
  } = eventData;

  const query = `
    INSERT INTO escrow_events (
      escrow_id, event_type, tx_hash, block_number,
      seller_address, buyer_address, amount, fee
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

  const values = [
    escrow_id, event_type, tx_hash, block_number,
    seller_address, buyer_address, amount, fee
  ];

  await pool.query(query, values);
}
```

---

## 🔐 **SEGURANÇA E VALIDAÇÕES**

### **1. Validações Frontend**
```javascript
// Validar endereço de carteira
function isValidAddress(address) {
  return ethers.isAddress(address);
}

// Validar rede
async function validateNetwork() {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId, 16) === CONFIG.NETWORK.id;
}

// Validar saldo suficiente
async function validateBalance(amount) {
  const balance = await mockUSDT.balanceOf(address);
  return balance >= ethers.parseUnits(amount.toString(), 6);
}
```

### **2. Validações Backend**
```javascript
// Middleware de validação de endereço
function validateWalletAddress(req, res, next) {
  const { wallet_address_vendedor, wallet_address_comprador } = req.body;
  
  if (wallet_address_vendedor && !ethers.isAddress(wallet_address_vendedor)) {
    return res.status(400).json({ error: 'Endereço do vendedor inválido' });
  }
  
  if (wallet_address_comprador && !ethers.isAddress(wallet_address_comprador)) {
    return res.status(400).json({ error: 'Endereço do comprador inválido' });
  }
  
  next();
}

// Validação de hash de transação
function validateTxHash(req, res, next) {
  const { tx_hash, approve_tx_hash } = req.body;
  
  const hashRegex = /^0x[a-fA-F0-9]{64}$/;
  
  if (tx_hash && !hashRegex.test(tx_hash)) {
    return res.status(400).json({ error: 'Hash de transação inválido' });
  }
  
  if (approve_tx_hash && !hashRegex.test(approve_tx_hash)) {
    return res.status(400).json({ error: 'Hash de aprovação inválido' });
  }
  
  next();
}
```

### **3. Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const blockchainLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por minuto para operações blockchain
  message: 'Muitas operações blockchain. Tente novamente em 1 minuto.',
  standardHeaders: true,
  legacyHeaders: false
});

// Aplicar em rotas blockchain
app.use('/api/boletos', blockchainLimiter);
app.use('/boletos/:numeroControle/baixar', blockchainLimiter);
```

---

## 📊 **MONITORAMENTO E LOGS**

### **1. Sistema de Logs**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/blockchain-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/blockchain-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Uso nos endpoints
logger.info('Escrow criado', {
  escrow_id,
  tx_hash,
  seller_address,
  amount: valor_usdt
});
```

### **2. Health Check**
```javascript
app.get('/health/blockchain', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // Testar conexão com a rede
    const blockNumber = await provider.getBlockNumber();
    
    // Testar contratos
    const p2pEscrow = new ethers.Contract(
      process.env.P2P_ESCROW_ADDRESS,
      ['function owner() external view returns (address)'],
      provider
    );
    
    const owner = await p2pEscrow.owner();
    
    res.json({
      status: 'healthy',
      network: process.env.NETWORK_NAME,
      blockNumber,
      contractOwner: owner,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## 🚀 **PROCESSO DE MIGRAÇÃO PARA PRODUÇÃO**

### **Fase 1: Preparação**
1. **Configurar ambiente de produção**
   - Polygon Mainnet RPC
   - Chaves privadas seguras
   - Variáveis de ambiente

2. **Atualizar banco de dados**
   - Executar migrations
   - Criar índices
   - Configurar backups

3. **Testes em testnet**
   - Deploy em Polygon Mumbai/Amoy
   - Testes de integração completos
   - Validação de performance

### **Fase 2: Deploy**
1. **Deploy dos contratos**
   ```bash
   npx hardhat run scripts/deploy-production.ts --network polygon
   npx hardhat verify --network polygon [CONTRACT_ADDRESS] [CONSTRUCTOR_ARGS]
   ```

2. **Atualizar configurações frontend**
   ```javascript
   // Atualizar endereços dos contratos
   const PRODUCTION_CONFIG = {
     MOCK_USDT: 'NOVO_ENDERECO_USDT',
     P2P_ESCROW: 'NOVO_ENDERECO_ESCROW',
     NETWORK: { id: 137, name: 'Polygon Mainnet' }
   };
   ```

3. **Atualizar variáveis de ambiente backend**
   ```env
   NETWORK_NAME=polygon
   RPC_URL=https://polygon-rpc.com
   P2P_ESCROW_ADDRESS=NOVO_ENDERECO_ESCROW
   MOCK_USDT_ADDRESS=NOVO_ENDERECO_USDT
   PRIVATE_KEY=CHAVE_PRIVADA_SEGURA
   ```

### **Fase 3: Validação**
1. **Testes de fumaça**
   - Criar boleto
   - Conectar carteira
   - Processar pagamento

2. **Monitoramento**
   - Logs de transações
   - Performance da rede
   - Custos de gas

3. **Rollback plan**
   - Backup do banco
   - Configurações anteriores
   - Procedimentos de emergência

---

## 💰 **CUSTOS E OTIMIZAÇÕES**

### **Gas Costs (Estimativas Polygon Mainnet):**
- **Deploy MockUSDT:** ~1,200,000 gas
- **Deploy P2PEscrow:** ~2,800,000 gas
- **createEscrow:** ~180,000 gas
- **approvePayment:** ~85,000 gas
- **approve (USDT):** ~46,000 gas

### **Otimizações:**
1. **Batch operations** para múltiplos boletos
2. **Gas price optimization** baseado na rede
3. **Lazy loading** de dados blockchain
4. **Cache** de informações estáticas

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comuns:**

#### **1. "Transaction reverted"**
- Verificar saldo de USDT
- Confirmar approve antes de createEscrow
- Validar parâmetros de entrada

#### **2. "Escrow not active"**
- Verificar se escrow já foi liberado
- Confirmar escrow_id correto
- Validar permissões do usuário

#### **3. "Insufficient gas"**
- Aumentar gas limit
- Verificar saldo de MATIC
- Otimizar gas price

#### **4. "Network mismatch"**
- Confirmar rede no MetaMask
- Validar chain ID
- Verificar RPC URL

### **Comandos de Debug:**
```bash
# Verificar saldo
npx hardhat run scripts/check-balance.js --network polygon

# Verificar escrow
npx hardhat run scripts/check-escrow.js --network polygon

# Verificar eventos
npx hardhat run scripts/check-events.js --network polygon
```

---

## 📞 **SUPORTE E MANUTENÇÃO**

### **Contatos Técnicos:**
- **Blockchain Developer:** [email]
- **Backend Developer:** [email]
- **DevOps:** [email]

### **Recursos:**
- **Documentação Polygon:** https://docs.polygon.technology/
- **Ethers.js Docs:** https://docs.ethers.org/
- **OpenZeppelin:** https://docs.openzeppelin.com/

### **Monitoramento:**
- **PolygonScan:** https://polygonscan.com/
- **Gas Tracker:** https://polygonscan.com/gastracker
- **Status da Rede:** https://status.polygon.technology/

---

## 📝 **CHANGELOG**

### **v1.0.0 - Implementação Inicial**
- Contratos MockUSDT e P2PEscrow
- Integração com MetaMask
- Sistema de escrow básico

### **v1.1.0 - Melhorias de Segurança**
- ReentrancyGuard
- Pausable functionality
- Event logging aprimorado

### **v1.2.0 - Integração Backend**
- Sincronização com PostgreSQL
- API endpoints atualizados
- Sistema de monitoramento

---

**📋 Documento gerado em:** `{new Date().toISOString()}`  
**🔧 Versão:** 1.2.0  
**👨‍💻 Autor:** Engenheiro de Software Sênior  
**🎯 Objetivo:** Migração para Produção - BoletoXCrypto

---

*Este documento deve ser atualizado a cada mudança significativa no sistema e revisado antes de cada deploy em produção.*

