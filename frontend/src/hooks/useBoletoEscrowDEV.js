import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

// 🧪 HOOK UNIFICADO PARA AMBIENTE DE DESENVOLVIMENTO
// Usado por VENDEDOR e COMPRADOR no ambiente DEV com server.js

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

export function useBoletoEscrowDEV() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('');

  // Verificar conexão da carteira
  const checkConnection = useCallback(async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const currentAddress = accounts[0].address;
          const chainId = (await provider.getNetwork()).chainId;

          if (chainId === BigInt(DEV_CONFIG.NETWORK.id)) {
            setIsConnected(true);
            setAddress(currentAddress);
            setError(null);
            console.log('🟢 [DEV] Carteira conectada:', currentAddress);
          } else {
            setIsConnected(false);
            setAddress(null);
            setError('Rede incorreta. Mude para Polygon Amoy.');
            console.log('🔴 [DEV] Rede incorreta:', chainId);
          }
        } else {
          setIsConnected(false);
          setAddress(null);
          console.log('🔴 [DEV] Carteira desconectada');
        }
      } catch (err) {
        console.error('❌ [DEV] Erro ao verificar conexão:', err);
        setIsConnected(false);
        setAddress(null);
        setError(err.message);
      }
    } else {
      setIsConnected(false);
      setAddress(null);
      setError('MetaMask não detectado.');
    }
  }, []);

  // Auto-verificação da conexão
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Conectar carteira
  const connectWallet = useCallback(async () => {
    // Verificação mais robusta para múltiplas carteiras
    const ethereum = window.ethereum;
    if (!ethereum) {
      setError('MetaMask ou carteira compatível não detectada.');
      return;
    }
    
    try {
      // Aguardar um pouco para resolver conflitos entre extensões
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Tentar conectar
      await ethereum.request({ method: 'eth_requestAccounts' });
      
      // Aguardar mais um pouco antes de verificar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await checkConnection(); // Re-verifica a conexão após a solicitação
    } catch (err) {
      console.error('❌ [DEV] Erro ao conectar carteira:', err);
      if (err.code === 4001) {
        setError('Usuário rejeitou a conexão com a carteira.');
      } else {
        setError('Erro ao conectar: ' + err.message);
      }
    }
  }, [checkConnection]);

  // Trocar/adicionar rede Amoy
  const switchToAmoy = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${DEV_CONFIG.NETWORK.id.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Rede não existe, adicionar
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${DEV_CONFIG.NETWORK.id.toString(16)}`,
            chainName: DEV_CONFIG.NETWORK.name,
            rpcUrls: [DEV_CONFIG.NETWORK.rpcUrl],
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
  }, []);

  /**
   * FUNÇÃO PARA VENDEDOR: Criar escrow completo (transferir USDT + criar escrow)
   */
  const createEscrowForSeller = useCallback(async (formData = {}) => {
    setIsCreatingEscrow(true);
    setError(null);
    setStep('Iniciando...');

    if (!isConnected || !address) {
      setError('Carteira não conectada.');
      setIsCreatingEscrow(false);
      return { success: false, error: 'Carteira não conectada.' };
    }

    try {
      console.log('🚀 [DEV-VENDEDOR] Criando escrow completo...');

      // 1. Verificar rede
      setStep('Verificando rede...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(DEV_CONFIG.NETWORK.id)) {
        setStep('Mudando para Amoy...');
        await switchToAmoy();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkConnection();
      }

      // 2. Preparar dados
      console.log('📦 [DEV-VENDEDOR] formData recebido:', formData);
      const valorUsdt = parseFloat(formData?.valorUSDT || formData?.valorUsdt || 100);
      const boletoId = BigInt(formData?.boletoId || Date.now());
      const fee = valorUsdt * 0.02; // Taxa 2%
      const totalAmount = valorUsdt + fee;

      console.log(`💰 [DEV-VENDEDOR] Valor: ${valorUsdt} USDT + Taxa 2%: ${fee} = Total: ${totalAmount} USDT`);

      // 3. Preparar contratos
      setStep('Preparando contratos...');
      const signer = await provider.getSigner();
      
      const mockUSDT = new ethers.Contract(DEV_CONFIG.MOCK_USDT, [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function balanceOf(address account) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ], signer);

      const p2pEscrow = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, [
        'function createEscrow(uint256 boletoId, uint256 amount, address buyer) external returns (bytes32)',
      ], signer);

      // 4. Aprovar USDT para o contrato
      setStep('Aprovando USDT...');
      const amount = ethers.parseUnits(totalAmount.toFixed(6), 6);
      
      console.log(`💸 [DEV-VENDEDOR] Aprovando ${totalAmount} USDT para o contrato...`);
      const approveTx = await mockUSDT.approve(DEV_CONFIG.P2P_ESCROW, amount);
      await approveTx.wait();
      console.log(`✅ [DEV-VENDEDOR] Aprovação confirmada: ${approveTx.hash}`);

      // 5. Criar escrow (o contrato fará o transferFrom)
      setStep('Criando escrow...');
      console.log('📋 [DEV] Parâmetros do createEscrow:', {
        boletoId: boletoId.toString(),
        amount: ethers.parseUnits(valorUsdt.toFixed(6), 6).toString(),
        buyer: address,
        seller: await signer.getAddress()
      });
      
      const createTx = await p2pEscrow.createEscrow(
        boletoId,
        ethers.parseUnits(valorUsdt.toFixed(6), 6),
        address // Usar o próprio endereço como buyer temporário
      );
      
      console.log('📊 [DEV] Verificando valores:');
      console.log('- Valor aprovado (approve):', ethers.formatUnits(amount, 6), 'USDT');
      console.log('- Valor do escrow (amount):', valorUsdt.toFixed(6), 'USDT');
      console.log('- Taxa:', fee.toFixed(6), 'USDT');
      console.log('- Total esperado:', totalAmount.toFixed(6), 'USDT');
      
      console.log('📋 [DEV] Transação createEscrow enviada:', createTx.hash);

      const receipt = await createTx.wait();
      console.log('✅ [DEV-VENDEDOR] Escrow criado:', createTx.hash);

      // 6. Extrair escrow ID do evento EscrowCreated
      let escrowId;
      try {
        console.log('🔍 [DEV] === ANÁLISE DE LOGS ===');
        console.log('🔍 [DEV] Total de logs na transação:', receipt.logs.length);
        console.log('🔍 [DEV] Endereço do contrato P2P:', DEV_CONFIG.P2P_ESCROW);
        
        // Debug: mostrar todos os logs
        receipt.logs.forEach((log, index) => {
          console.log(`🔍 [DEV] Log ${index}:`, {
            address: log.address,
            topics: log.topics,
            data: log.data
          });
        });
        
        // Tentar via interface primeiro (assinatura CORRETA do contrato)
        const p2pEscrowInterface = new ethers.Interface([
          'event EscrowCreated(bytes32 indexed escrowId, address indexed seller, uint256 boletoId, uint256 amount, uint256 fee)'
        ]);
        
        let escrowCreatedEvent = null;
        for (const log of receipt.logs) {
          // Verificar se o log é do nosso contrato
          if (log.address.toLowerCase() === DEV_CONFIG.P2P_ESCROW.toLowerCase()) {
            console.log('🎯 [DEV] Log do nosso contrato encontrado:', log);
            try {
              const parsedLog = p2pEscrowInterface.parseLog(log);
              console.log('✅ [DEV] Log parseado com sucesso:', parsedLog);
              if (parsedLog.name === 'EscrowCreated') {
                escrowCreatedEvent = parsedLog;
                console.log('🎉 [DEV] Evento EscrowCreated encontrado!', escrowCreatedEvent.args);
                break;
              }
            } catch (parseError) {
              console.warn('⚠️ [DEV] Erro ao parsear log do nosso contrato:', parseError);
            }
          }
        }
        
        if (escrowCreatedEvent) {
          escrowId = escrowCreatedEvent.args[0]; // escrowId é o primeiro argumento
          console.log('✅ [DEV] Escrow ID extraído do evento:', escrowId);
          console.log('✅ [DEV] Dados do evento:', {
            escrowId: escrowCreatedEvent.args[0],
            seller: escrowCreatedEvent.args[1],
            boletoId: escrowCreatedEvent.args[2].toString(),
            amount: escrowCreatedEvent.args[3].toString(),
            fee: escrowCreatedEvent.args[4].toString()
          });
        } else {
          console.error('❌ [DEV] Evento EscrowCreated NÃO encontrado!');
          console.error('❌ [DEV] Isso indica um problema grave - o contrato não emitiu o evento esperado');
          // Não podemos calcular manualmente sem o block.timestamp
          throw new Error('Evento EscrowCreated não encontrado - escrow pode não ter sido criado no contrato');
        }
      } catch (eventError) {
        console.error('❌ [DEV] Erro CRÍTICO ao extrair escrow ID:', eventError);
        throw eventError; // Re-throw para não mascarar o problema
      }

      setStep('Concluído!');

      const result = {
        success: true,
        txHash: createTx.hash,
        approveTxHash: approveTx.hash,
        boletoId: boletoId.toString(),
        sellerAddress: address,
        escrowId: escrowId,
        valorUsdt: valorUsdt,
        fee: fee,
        total: totalAmount
      };

      console.log('🎉 [DEV-VENDEDOR] Escrow completo criado:', result);
      return result;

    } catch (err) {
      console.error('❌ [DEV-VENDEDOR] Erro:', err);
      setError(err.message);
      setStep('Erro!');
      return { success: false, error: err.message };
    } finally {
      setIsCreatingEscrow(false);
    }
  }, [isConnected, address, checkConnection, switchToAmoy]);

  /**
   * FUNÇÃO PARA COMPRADOR: Registrar apenas o endereço (VENDEDOR já travou USDT)
   */
  const createEscrowForBuyer = useCallback(async (formData = {}) => {
    setIsCreatingEscrow(true);
    setError(null);
    setStep('Iniciando...');

    if (!isConnected || !address) {
      setError('Carteira não conectada.');
      setIsCreatingEscrow(false);
      return { success: false, error: 'Carteira não conectada.' };
    }

    try {
      console.log('🚀 [DEV-COMPRADOR] Registrando endereço...');

      // 1. Verificar rede
      setStep('Verificando rede...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(DEV_CONFIG.NETWORK.id)) {
        setStep('Mudando para Amoy...');
        await switchToAmoy();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkConnection();
      }

      // 2. Preparar dados
      const boletoId = BigInt(formData?.boletoId || formData?.numeroBoleto || Date.now());
      const buyerAddress = formData?.buyerAddress || address;

      console.log(`📝 [DEV-COMPRADOR] Boleto ID: ${boletoId}`);
      console.log(`👤 [DEV-COMPRADOR] Comprador: ${buyerAddress}`);

      // 3. Registrar no contrato
      setStep('Registrando comprador...');
      const signer = await provider.getSigner();
      
      const p2pEscrow = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, [
        'function registerBuyer(uint256 boletoId, address buyer) external returns (bytes32)',
      ], signer);

      const registerTx = await p2pEscrow.registerBuyer(boletoId, buyerAddress);
      const receipt = await registerTx.wait();
      
      console.log('✅ [DEV-COMPRADOR] Registro confirmado:', registerTx.hash);

      // 4. Extrair escrow ID do evento BuyerRegistered  
      let escrowId;
      try {
        console.log('🔍 [DEV-COMPRADOR] Logs da transação:', receipt.logs.length);
        
        // Tentar via interface primeiro
        const p2pEscrowInterface = new ethers.Interface([
          'event BuyerRegistered(bytes32 indexed escrowId, uint256 indexed boletoId, address indexed buyer)'
        ]);
        
        let buyerRegisteredEvent = null;
        for (const log of receipt.logs) {
          try {
            const parsedLog = p2pEscrowInterface.parseLog(log);
            if (parsedLog.name === 'BuyerRegistered') {
              buyerRegisteredEvent = parsedLog;
              break;
            }
          } catch (e) {
            // Log não é do nosso contrato, continuar
          }
        }
        
        if (buyerRegisteredEvent) {
          escrowId = buyerRegisteredEvent.args[0]; // escrowId é o primeiro argumento
          console.log('✅ [DEV-COMPRADOR] Escrow ID extraído do evento:', escrowId);
        } else {
          console.warn('⚠️ [DEV-COMPRADOR] Evento BuyerRegistered não encontrado!');
          // CÁLCULO MANUAL - usar o mesmo que o vendedor usou
          escrowId = ethers.keccak256(ethers.solidityPacked(['uint256', 'address'], [boletoId, buyerAddress]));
          console.log('🔧 [DEV-COMPRADOR] Escrow ID calculado manualmente:', escrowId);
        }
      } catch (eventError) {
        console.error('❌ [DEV-COMPRADOR] Erro ao extrair escrow ID:', eventError);
        // CÁLCULO MANUAL - usar o mesmo que o vendedor usou
        escrowId = ethers.keccak256(ethers.solidityPacked(['uint256', 'address'], [boletoId, buyerAddress]));
        console.log('🔧 [DEV-COMPRADOR] Escrow ID calculado como fallback:', escrowId);
      }

      setStep('Concluído!');

      const result = {
        success: true,
        txHash: registerTx.hash,
        boletoId: boletoId.toString(),
        buyerAddress: buyerAddress,
        escrowId: escrowId
      };

      console.log('🎉 [DEV-COMPRADOR] Endereço registrado:', result);
      return result;

    } catch (err) {
      console.error('❌ [DEV-COMPRADOR] Erro:', err);
      setError(err.message);
      setStep('Erro!');
      return { success: false, error: err.message };
    } finally {
      setIsCreatingEscrow(false);
    }
  }, [isConnected, address, checkConnection, switchToAmoy]);

  /**
   * FUNÇÃO PARA VENDEDOR: Aprovar pagamento e liberar USDT
   */
  const releaseEscrow = useCallback(async ({ escrowId }) => {
    if (!escrowId) {
      return { success: false, error: 'Escrow ID não fornecido' };
    }

    try {
      console.log('🔓 [DEV] Verificando status do escrow:', escrowId);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Primeiro, verificar se o escrow ainda está ativo
      const p2pEscrowRead = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, [
        'function escrows(bytes32) external view returns (uint256 boletoId, address seller, address buyer, uint256 amount, uint256 fee, bool isActive, bool isReleased)'
      ], provider);

      const escrowData = await p2pEscrowRead.escrows(escrowId);
      console.log('📊 [DEV] Status do escrow:', {
        boletoId: escrowData[0].toString(),
        seller: escrowData[1],
        buyer: escrowData[2],
        amount: ethers.formatUnits(escrowData[3], 6),
        fee: ethers.formatUnits(escrowData[4], 6),
        isActive: escrowData[5],
        isReleased: escrowData[6]
      });

      // Se já foi liberado, retornar sucesso sem tentar novamente
      if (escrowData[6]) { // isReleased = true
        console.log('✅ [DEV] Escrow já foi liberado anteriormente - apenas atualizando backend');
        return { success: true, txHash: 'already-released', alreadyReleased: true };
      }

      // Se não está ativo, erro
      if (!escrowData[5]) { // isActive = false
        console.log('❌ [DEV] Escrow não está ativo e não foi liberado - erro no estado');
        return { success: false, error: 'Escrow não está ativo nem foi liberado' };
      }

      // Se está ativo, tentar liberar
      console.log('🔓 [DEV] Escrow ativo - procedendo com liberação...');
      const p2pEscrow = new ethers.Contract(DEV_CONFIG.P2P_ESCROW, [
        'function approvePayment(bytes32 escrowId) external',
      ], signer);

      const approveTx = await p2pEscrow.approvePayment(escrowId);
      await approveTx.wait();

      console.log('✅ [DEV] Pagamento aprovado e escrow liberado:', approveTx.hash);
      return { success: true, txHash: approveTx.hash };

    } catch (err) {
      console.error('❌ [DEV] Erro ao processar escrow:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    // Estados
    isConnected,
    address,
    isCreatingEscrow,
    error,
    step,

    // Funções de conexão
    connectWallet,
    checkConnection,

    // Funções para VENDEDOR
    createEscrow: createEscrowForSeller, // Alias para compatibilidade
    createEscrowForSeller,
    releaseEscrow,

    // Funções para COMPRADOR  
    createEscrowForBuyer,

    // Utilitários
    switchToAmoy
  };
}
