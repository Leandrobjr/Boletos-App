/**
 * 🔧 HOOK CORRIGIDO - VERSÃO SIMPLIFICADA E ESTÁVEL
 * 
 * Solução profissional para conexão de carteira
 * 
 * @author Engenheiro Sênior
 * @version 4.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { buildApiUrl } from '../config/apiConfig';

// Configuração fixa para DEV - Contratos na Amoy
const DEV_CONFIG = {
  MOCK_USDT: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
  P2P_ESCROW: '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2',
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology'
  }
};

// ABIs dos contratos
const MOCK_USDT_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

const P2P_ESCROW_ABI = [
  'function createEnhancedEscrow(uint256 _boletoId, uint256 _boletoValue, address _buyer) external',
  'function registerBuyer(bytes32 _escrowId, address _buyer) external',
  'function approvePayment(bytes32 _escrowId) external',
  'function cancelEscrow(bytes32 _escrowId) external',
  'function owner() external view returns (address)',
  'function usdt() external view returns (address)',
  'function emergencyWithdraw(address _token) external',
  'function getEscrowDetails(bytes32 _escrowId) external view returns (tuple(address seller, address buyer, uint256 boletoValue, uint256 sellerFee, uint256 buyerFee, uint256 createdAt, uint256 uploadDeadline, uint256 autoReleaseTime, bool isActive, bool isReleased, bool isDisputed, bool uploadeado, uint8 status))',
  'event EscrowCreated(bytes32 indexed escrowId, address indexed seller, uint256 boletoId, uint256 boletoValue, uint256 sellerFee, uint256 buyerFee, uint256 createdAt)',
  'event BuyerRegistered(bytes32 indexed escrowId, address indexed buyer, uint256 timestamp)',
  'event EscrowReleased(bytes32 indexed escrowId, address indexed seller, address indexed buyer, uint256 boletoValue, uint256 sellerFeeRefunded, uint256 buyerFee, uint256 protocolEarnings, bool autoReleased)'
];

export const useBoletoEscrowFixed = () => {
  // Estados básicos
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [networkCorrect, setNetworkCorrect] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState('');

  // 🔌 CONECTAR CARTEIRA - VERSÃO SIMPLIFICADA
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const injected = window.ethereum;
      const providerLike = injected?.providers?.length
        ? injected.providers.find((p) => typeof p.request === 'function')
        : injected;

      if (!providerLike || typeof providerLike.request !== 'function') {
        throw new Error('Nenhuma carteira detectada. Use o botão WalletConnect ou instale MetaMask.');
      }

      const accounts = await providerLike.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta disponível na carteira');
      }

      const selectedAccount = accounts[0];

      let isCorrectNetwork = false;
      try {
        const chainIdHex = await providerLike.request({ method: 'eth_chainId' });
        const currentNetworkId = parseInt(chainIdHex, 16);
        isCorrectNetwork = currentNetworkId === DEV_CONFIG.NETWORK.id;
      } catch (_) {
        isCorrectNetwork = false;
      }

      // Não forçar troca de rede na conexão inicial — continuar mesmo em rede diferente
      setAddress(selectedAccount);
      setIsConnected(true);
      setNetworkCorrect(!!isCorrectNetwork);

      // Carregar owner do contrato (best-effort)
      try {
        const provider = new ethers.BrowserProvider(providerLike);
        const escrowRead = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, P2P_ESCROW_ABI, await provider.getSigner());
        const currentOwner = await escrowRead.owner();
        setOwnerAddress(currentOwner);
      } catch (ownerError) {
        console.warn('Erro ao carregar owner do contrato:', ownerError);
      }

      return { success: true, address: selectedAccount, networkCorrect: !!isCorrectNetwork };

    } catch (error) {
      setError(error.message);
      setIsConnected(false);
      setAddress('');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔄 DESCONECTAR CARTEIRA
  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAddress('');
    setNetworkCorrect(false);
    setError(null);
  }, []);

  // 🏗️ CRIAR ESCROW PARA VENDEDOR
  const createEscrowForSeller = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Carteira não conectada');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const boletoValue = parseFloat(formData.valorUSDT || formData.valorUsdt || 100);
      const valueInUsdt = ethers.parseUnits(boletoValue.toString(), 6);
      
      // Calcular taxa dinâmica do vendedor (2% inicial, pode ser devolvida parcialmente)
      const sellerFeePercentage = 2; // 2%
      const sellerFee = valueInUsdt * BigInt(sellerFeePercentage) / BigInt(100);
      const totalAmount = valueInUsdt + sellerFee;

      // Instanciar contratos
      const mockUSDT = new ethers.Contract(DEV_CONFIG.MOCK_USDT, MOCK_USDT_ABI, signer);
      const escrowContract = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, P2P_ESCROW_ABI, signer);

      // Verificar saldo
      const balance = await mockUSDT.balanceOf(address);
      if (balance < totalAmount) {
        throw new Error(`Saldo insuficiente. Necessário: ${ethers.formatUnits(totalAmount, 6)} USDT`);
      }

      // Aprovar USDT
      console.log('💰 [FIXED] Aprovando USDT:', ethers.formatUnits(totalAmount, 6));
      const approveTx = await mockUSDT.approve(DEV_CONFIG.P2P_ESCROW, totalAmount);
      await approveTx.wait();

      // Criar escrow aprimorado
      const boletoId = Date.now();
      console.log('🏗️ [FIXED] Criando escrow aprimorado:', { boletoId, boletoValue });
      
      const createTx = await escrowContract.createEnhancedEscrow(
        boletoId,
        valueInUsdt,
        ethers.ZeroAddress // Buyer será definido quando comprador reservar
      );

      const receipt = await createTx.wait();
      
      // Extrair escrow ID dos eventos
      const escrowId = extractEscrowIdFromLogs(receipt.logs, escrowContract);

      return {
        success: true,
        txHash: createTx.hash,
        approveTxHash: approveTx.hash,
        escrowId,
        boletoId,
        sellerAddress: address
      };

    } catch (error) {
      console.error('❌ [FIXED] Erro ao criar escrow:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // 🛒 REGISTRAR COMPRADOR
  const registerBuyer = useCallback(async (escrowId, buyerAddress) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Carteira não conectada');
      }

      if (!buyerAddress || buyerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Endereço do comprador é obrigatório e não pode ser zero');
      }


      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, P2P_ESCROW_ABI, signer);

      const tx = await contract.registerBuyer(escrowId, buyerAddress);
      await tx.wait();


      return {
        success: true,
        txHash: tx.hash,
        buyerAddress: buyerAddress,
        escrowId
      };

    } catch (error) {
      console.error('❌ [FIXED] Erro ao registrar comprador:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Alias para compatibilidade
  const createEscrowForBuyer = registerBuyer;

  // ✅ LIBERAR ESCROW
  const releaseEscrow = useCallback(async ({ escrowId }) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Carteira não conectada');
      }

      // Validar escrowId
      if (!escrowId || escrowId === '0x123' || escrowId.length < 10) {
        console.warn('⚠️ Escrow ID inválido para releaseEscrow:', escrowId);
        throw new Error('Escrow ID inválido');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, P2P_ESCROW_ABI, signer);

      // Verificar se escrow existe e está ativo
      try {
        const escrowDetails = await contract.getEscrowDetails(escrowId);
        const { isActive, isReleased } = escrowDetails;

        if (isReleased) {
          return { success: true, txHash: null, message: 'Escrow já foi liberado' };
        }

        if (!isActive) {
          console.log('⚠️ Escrow não está ativo:', escrowId);
          return { success: false, error: 'Escrow não está ativo - pode ter expirado ou sido cancelado' };
        }
      } catch (escrowError) {
        console.error('❌ Erro ao verificar estado do escrow:', escrowError);
        return { success: false, error: 'Escrow não encontrado ou inválido' };
      }

      const tx = await contract.approvePayment(escrowId);
      await tx.wait();

      // Disparar coleta de taxas no backend (não bloqueante)
      try {
        // Disparo não bloqueante; ignora resultado
        fetch(buildApiUrl('/fees/collect'), { method: 'POST' }).catch(() => {});
      } catch (_) {}

      return {
        success: true,
        txHash: tx.hash,
        message: 'Pagamento aprovado e USDT liberado'
      };

    } catch (error) {
      console.error('❌ [FIXED] Erro ao liberar escrow:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // 💸 SACAR TAXAS ACUMULADAS PARA O OWNER (USDT)
  const withdrawProtocolEarnings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Carteira não conectada');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, P2P_ESCROW_ABI, signer);

      const contractOwner = await contract.owner();
      if (contractOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Apenas o owner pode sacar as taxas');
      }

      const usdtAddress = await contract.usdt();
      const tx = await contract.emergencyWithdraw(usdtAddress);
      await tx.wait();

      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('❌ [FIXED] Erro ao sacar taxas:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

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
      console.warn('⚠️ [FIXED] Não foi possível extrair escrow ID dos logs, usando fallback');
      return ethers.keccak256(ethers.toUtf8Bytes(`fallback-${Date.now()}`));

    } catch (error) {
      console.error('❌ [FIXED] Erro ao extrair escrow ID:', error);
      return null;
    }
  };

  // 🔄 EFEITO: Monitorar mudanças de conta
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        
        if (accounts.length === 0) {
          // Desconectado
          disconnectWallet();
        } else if (accounts[0] !== address) {
          // Conta diferente
          setAddress(accounts[0]);
          
          // Verificar rede novamente
          try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const isCorrect = parseInt(chainId, 16) === DEV_CONFIG.NETWORK.id;
            setNetworkCorrect(isCorrect);
          } catch (error) {
            console.error('Erro ao verificar rede:', error);
          }
        }
      };

      const handleChainChanged = (chainId) => {
        const isCorrect = parseInt(chainId, 16) === DEV_CONFIG.NETWORK.id;
        setNetworkCorrect(isCorrect);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Verificar conexão inicial
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0 && !isConnected) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        })
        .catch(console.error);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address, isConnected, disconnectWallet]);

  // 📊 RETORNO DO HOOK
  return {
    // Estados
    isConnected,
    address,
    isLoading,
    error,
    networkCorrect,
    
    // Funções
    connectWallet,
    disconnectWallet,
    createEscrow: createEscrowForSeller,
    createEscrowForSeller,
    createEscrowForBuyer,
    registerBuyer,
    releaseEscrow,
    withdrawProtocolEarnings,
    
    // Configuração
    config: DEV_CONFIG,
    ownerAddress
  };
};
