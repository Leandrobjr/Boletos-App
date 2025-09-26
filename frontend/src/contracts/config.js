// Configuração dos contratos inteligentes
// Rede: Polygon Amoy (testnet)

export const CONTRACT_CONFIG = {
  // Endereços dos contratos deployados na rede Amoy (V2)
  MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
  P2P_ESCROW: '0x21cc8a936b5159EA8875Bfa28d92386FCd1Bb205', // CORRIGIDO - MockUSDT correto
  
  // Carteira do aplicativo (recebe as taxas)
  APP_WALLET: '0xBb3F758A5F73d4f3A9639f8926E1e7C7569cC452',
  
  // Configurações da rede
  NETWORK: {
    id: 80002, // Polygon Amoy testnet
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    blockExplorer: 'https://www.oklink.com/amoy',
    // RPCs alternativos para fallback
    alternativeRpcs: [
      'https://rpc-amoy.polygon.technology',
      'https://polygon-amoy.drpc.org',
      'https://amoy.polygon.technology',
      'https://rpc.ankr.com/polygon_amoy'
    ]
  },
  
  // Configurações de taxas
  FEES: {
    // Taxa de transação do vendedor (2% sobre o valor do boleto - CORRIGIDO)
    TRANSACTION_FEE_PERCENTAGE: 200, // 2%
    DENOMINATOR: 10000, // Base 100%
    
    // Taxa de serviço do comprador
    SERVICE_FEE_FIXED: 5, // R$ 5,00 para boletos até R$ 100,00
    SERVICE_FEE_PERCENTAGE: 400, // 4% para boletos acima de R$ 100,00
    SERVICE_FEE_THRESHOLD: 100, // R$ 100,00 limite para taxa fixa
    
    MIN_AMOUNT: 5000000 // 5 USDT (6 decimais para MockUSDT)
  },

  // Configurações de decimais dos tokens
  TOKENS: {
    MOCK_USDT: {
      decimals: 6, // MockUSDT tem 6 decimais
      symbol: 'USDT'
    }
  }
};

// Função para obter o endereço do contrato por nome
export const getContractAddress = (contractName) => {
  const addresses = {
    'MockUSDT': CONTRACT_CONFIG.MOCK_USDT,
    'P2PEscrow': CONTRACT_CONFIG.P2P_ESCROW
  };
  
  return addresses[contractName];
};

// Função para validar se estamos na rede correta
export const isCorrectNetwork = (chainId) => {
  return chainId === CONTRACT_CONFIG.NETWORK.id;
};
