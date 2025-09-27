import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Configuração fixa dos contratos
const CONFIG = {
  MOCK_USDT: '0xC02e92225DCe5Ca876d450e898F95D13C158c330',
  P2P_ESCROW: '0x1b01aad001fcA8b186258AA79f375c589F3bdDab',
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology'
  }
};

export function useBoletoEscrowSimple() {
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);

  // Verificar se carteira está conectada
  const checkConnection = useCallback(async () => {
    try {
      if (window.ethereum?.selectedAddress) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setIsConnected(true);
        setAddress(address);
        return { isConnected: true, address };
      } else {
        setIsConnected(false);
        setAddress(null);
        return { isConnected: false, address: null };
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
      setAddress(null);
      return { isConnected: false, address: null };
    }
  }, []);

  // Conectar carteira
  const connectWallet = useCallback(async () => {
    try {
      setStep('Conectando carteira...');
      
      // Solicitar conexão
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Verificar rede
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== CONFIG.NETWORK.id) {
        setStep('Mudando para rede Polygon Amoy...');
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONFIG.NETWORK.id.toString(16)}` }],
          });
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
          } else {
            throw switchError;
          }
        }
      }
      
      // Verificar conexão final
      const result = await checkConnection();
      setStep('Conectado!');
      
      return result;
    } catch (error) {
      console.error('Erro ao conectar carteira:', error);
      setError(error.message);
      setStep('Erro na conexão');
      throw error;
    }
  }, [checkConnection]);

  // Registrar COMPRADOR no escrow
  const createEscrow = useCallback(async (formData = {}) => {
    setIsCreatingEscrow(true);
    setError(null);
    setStep('Inicializando...');
    
    try {
      // 1. Verificar conexão
      const connection = await checkConnection();
      if (!connection.isConnected) {
        throw new Error('Carteira não conectada');
      }
      
      setStep('Preparando transação...');
      
      // 2. Preparar dados
      const boletoId = formData?.boletoId ?? formData?.numeroBoleto ?? BigInt(Date.now());
      const buyerAddress = formData?.buyerAddress ?? connection.address;
      
      console.log(`📝 Boleto ID: ${boletoId}`);
      console.log(`👤 COMPRADOR: ${buyerAddress}`);
      
      // 3. Criar contrato
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const p2pEscrow = new ethers.Contract(CONFIG.P2P_ESCROW, [
        'function registerBuyer(uint256 boletoId, address buyer) external returns (bytes32)',
        'function owner() view returns (address)',
        'function paused() view returns (bool)'
      ], signer);
      
      // 4. Executar transação
      setStep('Registrando COMPRADOR...');
      console.log('📝 Registrando endereço do COMPRADOR...');
      
      const registerTx = await p2pEscrow.registerBuyer(
        boletoId, 
        buyerAddress,
        { gasLimit: 200000 }
      );
      
      console.log(`✅ Registro enviado: ${registerTx.hash}`);
      setStep('Aguardando confirmação...');
      
      const registerReceipt = await registerTx.wait();
      if (registerReceipt.status !== 1) {
        throw new Error('Registro revertido no receipt');
      }
      
      console.log('✅ COMPRADOR registrado com sucesso');
      
      const escrowId = registerReceipt.logs[0]?.topics[1] || '0x' + Date.now().toString(16);
      
      setStep('Concluído!');
      
      const result = {
        success: true,
        txHash: registerTx.hash,
        boletoId: boletoId.toString(),
        buyerAddress: buyerAddress,
        escrowId: escrowId
      };
      
      console.log('🎉 COMPRADOR registrado com sucesso:', result);
      return result;
      
    } catch (err) {
      console.error('❌ Erro na criação do escrow:', err);
      setError(err.message);
      setStep('Erro!');
      throw err;
    } finally {
      setIsCreatingEscrow(false);
    }
  }, [checkConnection]);

  // Liberar escrow (para VENDEDOR)
  const releaseEscrow = useCallback(async (formData = {}) => {
    setIsCreatingEscrow(true);
    setError(null);
    setStep('Inicializando...');
    
    try {
      // 1. Verificar conexão
      const connection = await checkConnection();
      if (!connection.isConnected) {
        throw new Error('Carteira não conectada');
      }
      
      setStep('Preparando transação...');
      
      // 2. Preparar dados
      const escrowId = formData?.escrowId;
      if (!escrowId) {
        throw new Error('ID do escrow é obrigatório');
      }
      
      console.log(`📝 Escrow ID: ${escrowId}`);
      
      // 3. Criar contrato
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const p2pEscrow = new ethers.Contract(CONFIG.P2P_ESCROW, [
        'function releaseEscrow(bytes32 escrowId) external',
        'function owner() view returns (address)',
        'function paused() view returns (bool)'
      ], signer);
      
      // 4. Executar transação
      setStep('Liberando escrow...');
      console.log('📝 Liberando USDT do escrow...');
      
      const releaseTx = await p2pEscrow.releaseEscrow(escrowId, {
        gasLimit: 200000
      });
      
      console.log(`✅ Liberação enviada: ${releaseTx.hash}`);
      setStep('Aguardando confirmação...');
      
      const releaseReceipt = await releaseTx.wait();
      if (releaseReceipt.status !== 1) {
        throw new Error('Liberação revertida no receipt');
      }
      
      console.log('✅ Escrow liberado com sucesso');
      
      setStep('Concluído!');
      
      const result = {
        success: true,
        txHash: releaseTx.hash,
        escrowId: escrowId
      };
      
      console.log('🎉 Escrow liberado com sucesso:', result);
      return result;
      
    } catch (err) {
      console.error('❌ Erro na liberação do escrow:', err);
      setError(err.message);
      setStep('Erro!');
      throw err;
    } finally {
      setIsCreatingEscrow(false);
    }
  }, [checkConnection]);

  return {
    // Estados
    isCreatingEscrow,
    error,
    step,
    isConnected,
    address,
    
    // Funções
    checkConnection,
    connectWallet,
    createEscrow,
    releaseEscrow
  };
}
