/**
 * HOOK UNIVERSAL PARA ESCROW - ARQUITETURA DEFINITIVA
 * Usa o Universal Transaction Manager para máxima compatibilidade
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { universalTransactionManager } from '../services/UniversalTransactionManager';

// Configuração fixa dos contratos
const CONFIG = {
  MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
  P2P_ESCROW: '0x21cc8a936b5159EA8875Bfa28d92386FCd1Bb205', // NOVO - com MockUSDT correto
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology'
  }
};

export function useBoletoEscrowUniversal() {
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('');
  const [systemInfo, setSystemInfo] = useState(null);

  /**
   * Auto-inicializar sistema ao montar componente (apenas se carteira já conectada)
   */
  useEffect(() => {
    const autoInitialize = async () => {
      try {
        // Verificar se carteira já está conectada
        if (window.ethereum?.selectedAddress) {
          console.log('🚀 [UNIVERSAL] Carteira já conectada, configurando sistema...');
          
          // Não chamar initializeSystem() para evitar popup
          // Apenas configurar o sistema com dados existentes
          const currentInfo = {
            isConnected: true,
            address: window.ethereum.selectedAddress,
            walletType: 'MetaMask',
            isInitialized: true
          };
          setSystemInfo(currentInfo);
          console.log('✅ [UNIVERSAL] Sistema configurado com carteira existente:', currentInfo);
        } else {
          console.log('⚠️ [UNIVERSAL] Carteira não conectada, aguardando conexão manual');
        }
      } catch (error) {
        console.log('⚠️ [UNIVERSAL] Auto-configuração falhou:', error.message);
      }
    };
    
    autoInitialize();
  }, []); // Executar apenas uma vez ao montar

  /**
   * Monitorar mudanças no sistema universal
   */
  useEffect(() => {
    const checkSystemStatus = () => {
      if (universalTransactionManager) {
        const currentInfo = universalTransactionManager.getCurrentInfo();
        
        // Comparar propriedades específicas ao invés do objeto inteiro
        const hasChanged = !systemInfo || 
          currentInfo.isConnected !== systemInfo.isConnected ||
          currentInfo.address !== systemInfo.address ||
          currentInfo.walletType !== systemInfo.walletType;
          
        if (hasChanged) {
          console.log('🔄 [UNIVERSAL] Sistema atualizado:', currentInfo);
          setSystemInfo(currentInfo);
        }
      }
    };

    // Verificar imediatamente
    checkSystemStatus();

    // DESABILITADO TEMPORARIAMENTE PARA CORRIGIR LOOP INFINITO
    // // Verificar periodicamente (aumentado para 2 segundos para evitar spam)
    // const interval = setInterval(checkSystemStatus, 2000);
    // return () => clearInterval(interval);
  }, [systemInfo?.isConnected, systemInfo?.address, systemInfo?.walletType]);

  /**
   * Inicializar sistema universal
   */
  const initializeSystem = useCallback(async () => {
    try {
      setStep('Inicializando sistema...');
      console.log('🚀 [UNIVERSAL] Inicializando sistema universal...');
      
      const initResult = await universalTransactionManager.initialize();
      setSystemInfo(initResult);
      
      console.log('✅ [UNIVERSAL] Sistema inicializado:', initResult.wallet.name);
      return initResult;
    } catch (error) {
      console.error('❌ [UNIVERSAL] Erro na inicialização:', error.message);
      throw error;
    }
  }, []);

  /**
   * Health check do sistema
   */
  const checkSystemHealth = useCallback(async () => {
    try {
      const health = await universalTransactionManager.healthCheck();
      console.log('🩺 [UNIVERSAL] Health check:', health);
      return health;
    } catch (error) {
      console.error('❌ [UNIVERSAL] Erro no health check:', error.message);
      return { status: 'ERROR', message: error.message };
    }
  }, []);

  /**
   * Registrar COMPRADOR no escrow (VENDEDOR já tem USDT travado)
   */
  const createEscrow = useCallback(async (formData = {}) => {
    setIsCreatingEscrow(true);
    setError(null);
    setStep('Inicializando...');
    
    try {
      console.log('🚀 [UNIVERSAL] Registrando COMPRADOR no escrow...');
      
      // 1. Inicializar sistema se necessário
      let initResult = systemInfo;
      if (!initResult) {
        initResult = await initializeSystem();
      }
      
      // 2. Verificar se está na rede correta
      setStep('Verificando rede...');
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== CONFIG.NETWORK.id) {
        console.log(`⚠️ [UNIVERSAL] Rede incorreta: ${currentChainId} (esperado: ${CONFIG.NETWORK.id})`);
        setStep('Solicitando mudança de rede...');
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONFIG.NETWORK.id.toString(16)}` }],
          });
          console.log('✅ [UNIVERSAL] Rede alterada para Polygon Amoy');
        } catch (switchError) {
          if (switchError.code === 4902) {
            // Rede não existe, adicionar
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${CONFIG.NETWORK.id.toString(16)}`,
                chainName: CONFIG.NETWORK.name,
                rpcUrls: [CONFIG.NETWORK.rpcUrl],
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                blockExplorerUrls: ['https://amoy.polygonscan.com/']
              }],
            });
            console.log('✅ [UNIVERSAL] Rede Polygon Amoy adicionada');
          } else {
            throw new Error(`Erro ao mudar rede: ${switchError.message}`);
          }
        }
      }
      
      setStep(`Conectado com ${initResult.wallet.name}...`);
      
      // 3. Preparar dados do boleto
      const boletoId = formData?.boletoId ?? formData?.numeroBoleto ?? BigInt(Date.now());
      const buyerAddress = formData?.buyerAddress ?? initResult.connection.address;
      
      console.log(`📝 [UNIVERSAL] Boleto ID: ${boletoId}`);
      console.log(`👤 [UNIVERSAL] COMPRADOR: ${buyerAddress}`);
      
      // 3. Criar contrato P2PEscrow
      setStep('Preparando contrato...');
      
      const p2pEscrow = new ethers.Contract(CONFIG.P2P_ESCROW, [
        'function registerBuyer(uint256 boletoId, address buyer) external returns (bytes32)',
        'function owner() view returns (address)',
        'function paused() view returns (bool)'
      ]);
      
      // 4. Registrar COMPRADOR no escrow (VENDEDOR já tem USDT travado)
      setStep('Registrando COMPRADOR...');
      console.log('📝 [UNIVERSAL] Registrando endereço do COMPRADOR...');
      
      // Usar transação direta com ethers para evitar problemas do sistema universal
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = p2pEscrow.connect(signer);
      
      const registerTx = await contractWithSigner.registerBuyer(
        boletoId, 
        buyerAddress,
        { gasLimit: 200000 }
      );
      
      console.log(`✅ [UNIVERSAL] Registro enviado: ${registerTx.hash}`);
      setStep('Aguardando confirmação...');
      
      const registerReceipt = await registerTx.wait();
      if (registerReceipt.status !== 1) {
        throw new Error('Registro revertido no receipt');
      }
      
      console.log('✅ [UNIVERSAL] COMPRADOR registrado com sucesso');
      
      // 5. Extrair escrow ID do evento
      const escrowId = registerReceipt.logs[0]?.topics[1] || '0x' + Date.now().toString(16);
      
      setStep('Concluído!');
      
      const result = {
        success: true,
        txHash: registerTx.hash,
        boletoId: boletoId.toString(),
        buyerAddress: buyerAddress,
        escrowId: escrowId,
        wallet: initResult.wallet.name,
        adapter: initResult.wallet.type
      };
      
      console.log('🎉 [UNIVERSAL] COMPRADOR registrado com sucesso:', result);
      return result;
      
    } catch (err) {
      console.error('❌ [UNIVERSAL] Erro na criação do escrow:', err);
      setError(err.message);
      setStep('Erro!');
      throw err;
    } finally {
      setIsCreatingEscrow(false);
    }
  }, [systemInfo, initializeSystem]);

  /**
   * Destrava USDT do escrow (liberar para o vendedor após timeout)
   */
  const releaseEscrow = useCallback(async ({ escrowId }) => {
    try {
      console.log('🔓 [UNIVERSAL] Iniciando destravamento do escrow...');
      console.log('🔍 [UNIVERSAL] Escrow ID:', escrowId);
      
      setStep('Destravando USDT...');
      
      // Garantir que o sistema está inicializado
      if (!systemInfo?.isConnected) {
        console.log('🔄 [UNIVERSAL] Sistema não conectado, inicializando...');
        await initializeSystem();
      }

      // Executar releaseEscrow no contrato
      const txHash = await universalTransactionManager.executeContractMethod({
        contractAddress: CONFIG.P2P_ESCROW,
        method: 'releaseEscrow',
        params: [escrowId] // Apenas o escrowId como parâmetro
      });

      console.log('✅ [UNIVERSAL] Escrow destravado:', txHash);
      setStep('USDT destravado com sucesso!');
      
      return {
        success: true,
        txHash: txHash,
        message: 'USDT destravado e devolvido ao vendedor'
      };
      
    } catch (err) {
      console.error('❌ [UNIVERSAL] Erro ao destravar escrow:', err);
      setError(err.message);
      setStep('Erro no destravamento!');
      
      return {
        success: false,
        error: err.message
      };
    }
  }, [systemInfo, initializeSystem]);

  /**
   * Reset do sistema
   */
  const resetSystem = useCallback(async () => {
    try {
      setStep('Resetando sistema...');
      await universalTransactionManager.reset();
      const newInfo = universalTransactionManager.getCurrentInfo();
      setSystemInfo(newInfo);
      setStep('Sistema resetado');
    } catch (error) {
      console.error('❌ [UNIVERSAL] Erro no reset:', error.message);
      setError(error.message);
    }
  }, []);

  return {
    createEscrow,
    releaseEscrow,
    initializeSystem,
    checkSystemHealth,
    resetSystem,
    isCreatingEscrow,
    error,
    step,
    systemInfo
  };
}
