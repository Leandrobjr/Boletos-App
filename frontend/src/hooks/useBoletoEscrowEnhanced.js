/**
 * 🔗 HOOK APRIMORADO - ESCROW COM TAXAS DINÂMICAS
 * 
 * Integra com o novo contrato P2PEscrowEnhanced que suporta:
 * - Taxas dinâmicas do comprador
 * - Taxas baseadas em tempo para vendedor
 * - Temporizadores automáticos
 * - Sistema de disputas
 * 
 * @author Engenheiro Sênior
 * @version 2.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

// 🔧 CONFIGURAÇÃO APRIMORADA
const ENHANCED_CONFIG = {
  // Endereços dos contratos atualizados após deploy
  MOCK_USDT: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
  P2P_ESCROW_ENHANCED: '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2',
  PROTOCOL_WALLET: '0x9950764Ad4548E9106E3106c954a87D8b3CF64a7',
  
  // Configuração de rede
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com'
  },

  // Configurações de taxas e tempo
  FEES: {
    SELLER_FEE_PERCENTAGE: 2, // 2%
    BUYER_FEE_PERCENTAGE: 4, // 4%
    FIXED_BUYER_FEE: 5.00, // R$ 5.00
    BUYER_FEE_THRESHOLD: 100.00 // R$ 100.00
  },

  TIMEOUTS: {
    UPLOAD_DEADLINE: 1 * 60 * 60 * 1000, // 1 hora
    FULL_REFUND_PERIOD: 2 * 60 * 60 * 1000, // 2 horas
    HALF_REFUND_PERIOD: 24 * 60 * 60 * 1000, // 24 horas
    QUARTER_REFUND_PERIOD: 48 * 60 * 60 * 1000, // 48 horas
    AUTO_RELEASE_PERIOD: 72 * 60 * 60 * 1000 // 72 horas
  }
};

// 📋 ABIs DOS CONTRATOS APRIMORADOS
const ENHANCED_MOCK_USDT_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

const ENHANCED_P2P_ESCROW_ABI = [
  // 🏗️ CREATION FUNCTIONS
  'function createEnhancedEscrow(uint256 _boletoId, uint256 _boletoValue, address _buyer) external',
  'function registerBuyer(bytes32 _escrowId, address _buyer) external',
  
  // 💰 PAYMENT FUNCTIONS
  'function markPaymentProofUploaded(bytes32 _escrowId) external',
  'function approvePayment(bytes32 _escrowId) external',
  'function autoReleaseEscrow(bytes32 _escrowId) external',
  
  // ❌ CANCELLATION FUNCTIONS
  'function cancelEscrow(bytes32 _escrowId) external',
  'function expireEscrow(bytes32 _escrowId) external',
  
  // 🚨 DISPUTE FUNCTIONS
  'function createDispute(bytes32 _escrowId) external',
  'function resolveDispute(bytes32 _escrowId, address _winner) external',
  
  // 📊 VIEW FUNCTIONS
  'function calculateBuyerFee(uint256 boletoValue) external pure returns (uint256)',
  'function calculateSellerRefund(uint256 createdAt, uint256 currentTime, uint256 originalFee) external pure returns (uint256)',
  'function getEscrowDetails(bytes32 _escrowId) external view returns (tuple(address seller, address buyer, uint256 boletoValue, uint256 sellerFee, uint256 buyerFee, uint256 createdAt, uint256 uploadDeadline, uint256 autoReleaseTime, bool isActive, bool isReleased, bool isDisputed, bool uploadeado, uint8 status))',
  'function canAutoRelease(bytes32 _escrowId) external view returns (bool)',
  
  // 📋 EVENTS
  'event EscrowCreated(bytes32 indexed escrowId, address indexed seller, uint256 boletoId, uint256 boletoValue, uint256 sellerFee, uint256 buyerFee, uint256 createdAt)',
  'event BuyerRegistered(bytes32 indexed escrowId, address indexed buyer, uint256 timestamp)',
  'event PaymentProofUploaded(bytes32 indexed escrowId, address indexed buyer, uint256 timestamp)',
  'event EscrowReleased(bytes32 indexed escrowId, address indexed seller, address indexed buyer, uint256 boletoValue, uint256 sellerFeeRefunded, uint256 buyerFee, uint256 protocolEarnings, bool autoReleased)',
  'event EscrowCancelled(bytes32 indexed escrowId, address indexed seller, uint256 refundAmount, uint256 timestamp)',
  'event DisputeCreated(bytes32 indexed escrowId, address indexed initiator, uint256 timestamp)'
];

const useBoletoEscrowEnhanced = () => {
  // 🔧 ESTADOS
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [networkCorrect, setNetworkCorrect] = useState(false);
  const [dynamicFees, setDynamicFees] = useState(null);
  const [timerInfo, setTimerInfo] = useState(null);

  // 💰 CLIENTE DA API PARA TAXAS DINÂMICAS
  const apiClient = {
    async calculateFees(boletoValue) {
      try {
        const response = await fetch('http://localhost:3001/api/taxas/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boletoValue })
        });
        return await response.json();
      } catch (error) {
        console.error('❌ Erro ao calcular taxas:', error);
        return null;
      }
    },

    async getTransactionStatus(numeroControle) {
      try {
        const response = await fetch(`http://localhost:3001/api/taxas/${numeroControle}`);
        return await response.json();
      } catch (error) {
        console.error('❌ Erro ao obter status:', error);
        return null;
      }
    }
  };

  // 🔌 CONECTAR CARTEIRA
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask não está instalado!');
      }

      // Solicitar conexão
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('Nenhuma conta conectada');
      }

      const account = accounts[0];
      setAddress(account);
      setIsConnected(true);

      // Verificar rede
      await checkNetwork();

      console.log('✅ Carteira conectada:', account);
      return { success: true, address: account };

    } catch (error) {
      console.error('❌ Erro ao conectar carteira:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🌐 VERIFICAR REDE
  const checkNetwork = useCallback(async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrect = parseInt(chainId, 16) === ENHANCED_CONFIG.NETWORK.id;
      setNetworkCorrect(isCorrect);

      if (!isCorrect) {
        console.warn('⚠️  Rede incorreta. Esperada:', ENHANCED_CONFIG.NETWORK.name);
      }

      return isCorrect;
    } catch (error) {
      console.error('❌ Erro ao verificar rede:', error);
      return false;
    }
  }, []);

  // 💰 CALCULAR TAXAS DINÂMICAS
  const calculateDynamicFees = useCallback(async (boletoValue) => {
    try {
      // Calcular via contrato (mais preciso)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        ENHANCED_CONFIG.P2P_ESCROW_ENHANCED,
        ENHANCED_P2P_ESCROW_ABI,
        provider
      );

      const valueInUsdt = ethers.parseUnits(boletoValue.toString(), 6);
      const buyerFee = await contract.calculateBuyerFee(valueInUsdt);
      const sellerFee = valueInUsdt * BigInt(2) / BigInt(100); // 2%

      const fees = {
        boletoValue: parseFloat(boletoValue),
        buyerFee: parseFloat(ethers.formatUnits(buyerFee, 6)),
        sellerFee: parseFloat(ethers.formatUnits(sellerFee, 6)),
        totalBuyerCost: parseFloat(boletoValue) + parseFloat(ethers.formatUnits(buyerFee, 6)),
        sellerReceives: parseFloat(boletoValue) - parseFloat(ethers.formatUnits(sellerFee, 6)),
        protocolEarns: parseFloat(ethers.formatUnits(buyerFee, 6)) + parseFloat(ethers.formatUnits(sellerFee, 6))
      };

      setDynamicFees(fees);
      return fees;

    } catch (error) {
      console.error('❌ Erro ao calcular taxas dinâmicas:', error);
      return null;
    }
  }, []);

  // 🏗️ CRIAR ESCROW APRIMORADO
  const createEnhancedEscrow = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const boletoValue = parseFloat(formData.valorUSDT || formData.valorUsdt || 100);
      
      // Calcular taxas dinâmicas
      const fees = await calculateDynamicFees(boletoValue);
      if (!fees) {
        throw new Error('Erro ao calcular taxas dinâmicas');
      }

      const valueInUsdt = ethers.parseUnits(boletoValue.toString(), 6);
      const totalRequired = ethers.parseUnits((boletoValue + fees.sellerFee).toString(), 6);

      // Instanciar contratos
      const mockUSDT = new ethers.Contract(ENHANCED_CONFIG.MOCK_USDT, ENHANCED_MOCK_USDT_ABI, signer);
      const escrowContract = new ethers.Contract(ENHANCED_CONFIG.P2P_ESCROW_ENHANCED, ENHANCED_P2P_ESCROW_ABI, signer);

      // Verificar saldo
      const balance = await mockUSDT.balanceOf(address);
      if (balance < totalRequired) {
        throw new Error(`Saldo insuficiente. Necessário: ${ethers.formatUnits(totalRequired, 6)} USDT`);
      }

      // Aprovar USDT
      console.log('💰 Aprovando USDT:', ethers.formatUnits(totalRequired, 6));
      const approveTx = await mockUSDT.approve(ENHANCED_CONFIG.P2P_ESCROW_ENHANCED, totalRequired);
      await approveTx.wait();

      // Criar escrow aprimorado
      const boletoId = Date.now();
      console.log('🏗️ Criando escrow aprimorado:', { boletoId, boletoValue, fees });
      
      const createTx = await escrowContract.createEnhancedEscrow(
        boletoId,
        valueInUsdt,
        address // seller como buyer temporário
      );

      const receipt = await createTx.wait();
      
      // Extrair escrow ID dos eventos
      const escrowId = extractEscrowIdFromLogs(receipt.logs, escrowContract);

      // Calcular informações de tempo
      const creationTime = Date.now();
      const timeInfo = {
        createdAt: creationTime,
        uploadDeadline: creationTime + ENHANCED_CONFIG.TIMEOUTS.UPLOAD_DEADLINE,
        autoReleaseTime: creationTime + ENHANCED_CONFIG.TIMEOUTS.AUTO_RELEASE_PERIOD,
        fullRefundUntil: creationTime + ENHANCED_CONFIG.TIMEOUTS.FULL_REFUND_PERIOD,
        halfRefundUntil: creationTime + ENHANCED_CONFIG.TIMEOUTS.HALF_REFUND_PERIOD,
        quarterRefundUntil: creationTime + ENHANCED_CONFIG.TIMEOUTS.QUARTER_REFUND_PERIOD
      };

      setTimerInfo(timeInfo);

      return {
        success: true,
        txHash: createTx.hash,
        approveTxHash: approveTx.hash,
        escrowId,
        boletoId,
        fees,
        timeInfo,
        explorerUrl: `${ENHANCED_CONFIG.NETWORK.explorerUrl}/tx/${createTx.hash}`
      };

    } catch (error) {
      console.error('❌ Erro ao criar escrow aprimorado:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [address, calculateDynamicFees]);

  // 📤 MARCAR COMPROVANTE COMO ENVIADO
  const markPaymentProofUploaded = useCallback(async ({ escrowId }) => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ENHANCED_CONFIG.P2P_ESCROW_ENHANCED, ENHANCED_P2P_ESCROW_ABI, signer);

      const tx = await contract.markPaymentProofUploaded(escrowId);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        explorerUrl: `${ENHANCED_CONFIG.NETWORK.explorerUrl}/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Erro ao marcar comprovante:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ APROVAR PAGAMENTO (VENDEDOR)
  const approvePayment = useCallback(async ({ escrowId }) => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ENHANCED_CONFIG.P2P_ESCROW_ENHANCED, ENHANCED_P2P_ESCROW_ABI, signer);

      // Verificar detalhes do escrow antes de aprovar
      const escrowDetails = await contract.getEscrowDetails(escrowId);
      console.log('📊 Detalhes do escrow antes da aprovação:', escrowDetails);

      const tx = await contract.approvePayment(escrowId);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        explorerUrl: `${ENHANCED_CONFIG.NETWORK.explorerUrl}/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Erro ao aprovar pagamento:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔄 LIBERAÇÃO AUTOMÁTICA
  const autoReleaseEscrow = useCallback(async ({ escrowId }) => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ENHANCED_CONFIG.P2P_ESCROW_ENHANCED, ENHANCED_P2P_ESCROW_ABI, signer);

      // Verificar se pode ser liberado automaticamente
      const canRelease = await contract.canAutoRelease(escrowId);
      if (!canRelease) {
        throw new Error('Escrow não pode ser liberado automaticamente ainda');
      }

      const tx = await contract.autoReleaseEscrow(escrowId);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        isAutoRelease: true,
        explorerUrl: `${ENHANCED_CONFIG.NETWORK.explorerUrl}/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Erro na liberação automática:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🚨 CRIAR DISPUTA
  const createDispute = useCallback(async ({ escrowId }) => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ENHANCED_CONFIG.P2P_ESCROW_ENHANCED, ENHANCED_P2P_ESCROW_ABI, signer);

      const tx = await contract.createDispute(escrowId);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        explorerUrl: `${ENHANCED_CONFIG.NETWORK.explorerUrl}/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Erro ao criar disputa:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 📊 OBTER DETALHES DO ESCROW
  const getEscrowDetails = useCallback(async (escrowId) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(ENHANCED_CONFIG.P2P_ESCROW_ENHANCED, ENHANCED_P2P_ESCROW_ABI, provider);

      const details = await contract.getEscrowDetails(escrowId);
      
      return {
        seller: details[0],
        buyer: details[1],
        boletoValue: parseFloat(ethers.formatUnits(details[2], 6)),
        sellerFee: parseFloat(ethers.formatUnits(details[3], 6)),
        buyerFee: parseFloat(ethers.formatUnits(details[4], 6)),
        createdAt: Number(details[5]) * 1000, // Convert to milliseconds
        uploadDeadline: Number(details[6]) * 1000,
        autoReleaseTime: Number(details[7]) * 1000,
        isActive: details[8],
        isReleased: details[9],
        isDisputed: details[10],
        uploadeado: details[11],
        status: Number(details[12])
      };

    } catch (error) {
      console.error('❌ Erro ao obter detalhes do escrow:', error);
      return null;
    }
  }, []);

  // 🔧 FUNÇÃO AUXILIAR: Extrair escrow ID dos logs
  const extractEscrowIdFromLogs = (logs, contract) => {
    try {
      for (const log of logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsed && parsed.name === 'EscrowCreated') {
            return parsed.args.escrowId;
          }
        } catch (parseError) {
          continue;
        }
      }

      // Fallback: gerar ID baseado em timestamp
      console.warn('⚠️  Não foi possível extrair escrow ID dos logs, usando fallback');
      return ethers.keccak256(ethers.toUtf8Bytes(`fallback-${Date.now()}`));

    } catch (error) {
      console.error('❌ Erro ao extrair escrow ID:', error);
      return null;
    }
  };

  // 🔄 EFEITO: Monitorar mudanças de rede
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          setIsConnected(false);
          setAddress('');
        } else {
          setAddress(accounts[0]);
        }
      });

      return () => {
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('accountsChanged');
      };
    }
  }, [checkNetwork]);

  // 📊 RETORNO DO HOOK
  return {
    // Estados
    isConnected,
    address,
    isLoading,
    error,
    networkCorrect,
    dynamicFees,
    timerInfo,
    
    // Funções principais
    connectWallet,
    createEnhancedEscrow,
    markPaymentProofUploaded,
    approvePayment,
    autoReleaseEscrow,
    createDispute,
    getEscrowDetails,
    
    // Funções auxiliares
    calculateDynamicFees,
    checkNetwork,
    
    // Configuração
    config: ENHANCED_CONFIG,
    
    // API client
    api: apiClient
  };
};

export default useBoletoEscrowEnhanced;

