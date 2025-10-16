import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function DirectWalletConnector() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState([]);
  const [directConnection, setDirectConnection] = useState(null);

  useEffect(() => {
    detectWallets();
    checkDirectConnection();
  }, []);

  const checkDirectConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setDirectConnection({
            address: accounts[0],
            isConnected: true
          });
        }
      } catch (error) {
        console.log('Erro ao verificar conexão direta:', error);
      }
    }
  };

  const detectWallets = () => {
    const wallets = [];
    
    // Detectar MetaMask diretamente
    if (typeof window !== 'undefined' && window.ethereum) {
      if (window.ethereum.isMetaMask) {
        wallets.push({
          id: 'metaMask',
          name: 'MetaMask',
          available: true,
          icon: '🦊'
        });
      }
      
      // Detectar outras carteiras
      if (window.ethereum.isCoinbaseWallet) {
        wallets.push({
          id: 'coinbaseWallet',
          name: 'Coinbase Wallet',
          available: true,
          icon: '🔵'
        });
      }
      
      if (window.ethereum.isBraveWallet) {
        wallets.push({
          id: 'braveWallet',
          name: 'Brave Wallet',
          available: true,
          icon: '🦁'
        });
      }
    }
    
    setDetectedWallets(wallets);
  };

  const handleDirectConnect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Nenhuma carteira detectada. Instale o MetaMask.');
      return;
    }

    setIsConnecting(true);
    try {
      console.log('🦊 [DIRECT] Iniciando conexão direta...');
      
      // Verificar se já está conectado
      let accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length === 0) {
        // Solicitar conexão
        console.log('🦊 [DIRECT] Solicitando conexão...');
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
      }
      
      if (accounts.length > 0) {
        console.log('✅ [DIRECT] Contas obtidas:', accounts);
        
        // Trocar para Polygon Amoy
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }], // Polygon Amoy
          });
          console.log('✅ [DIRECT] Rede alterada para Polygon Amoy');
        } catch (switchError) {
          // Se a rede não existir, adicionar
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13882',
                chainName: 'Polygon Amoy',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology'],
                blockExplorerUrls: ['https://amoy.polygonscan.com'],
              }],
            });
            console.log('✅ [DIRECT] Rede Polygon Amoy adicionada');
          }
        }
        
        setDirectConnection({
          address: accounts[0],
          isConnected: true
        });
        
        // Forçar atualização do estado
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('directWalletConnected', {
            detail: { address: accounts[0], isConnected: true }
          }));
        }, 100);
        
        console.log(`✅ [DIRECT] Conectado com sucesso! Conta: ${accounts[0]}`);
      }
    } catch (error) {
      console.error('❌ [DIRECT] Erro ao conectar:', error);
      alert(`Erro ao conectar: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWagmiConnect = async (connectorId) => {
    setIsConnecting(true);
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      console.error('Erro ao conectar via Wagmi:', error);
      alert(`Erro ao conectar via Wagmi: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Mostrar como conectado se Wagmi conectou OU se há conexão direta
  const isActuallyConnected = isConnected || directConnection?.isConnected;
  const currentAddress = address || directConnection?.address;
  const currentConnector = connector?.name || 'MetaMask (Direto)';

  if (isActuallyConnected) {
    return (
      <div className="bg-green-100 p-4 rounded-lg mb-4 border-2 border-green-400">
        <h3 className="text-lg font-semibold mb-2">✅ Carteira Conectada</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Carteira:</span>
            <span className="text-sm">{currentConnector}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Endereço:</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'Nenhum'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Método:</span>
            <span className="text-sm">
              {isConnected ? 'Wagmi' : 'Conexão Direta'}
            </span>
          </div>
          <button
            onClick={() => {
              if (isConnected) {
                disconnect();
              }
              setDirectConnection(null);
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 p-4 rounded-lg mb-4 border-2 border-blue-400">
      <h3 className="text-lg font-semibold mb-2">🔗 Conectar Carteira</h3>
      
      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          Carteiras detectadas: {detectedWallets.length}
        </div>
        
        {detectedWallets.length > 0 && (
          <div className="space-y-2">
            {detectedWallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{wallet.icon}</span>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <button
                  onClick={() => handleWagmiConnect(wallet.id)}
                  disabled={isPending || isConnecting}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  {isPending || isConnecting ? 'Conectando...' : 'Conectar'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-3">
          <div className="text-sm text-gray-600 mb-2">
            Conexão direta (contorna problemas de detecção):
          </div>
          <button
            onClick={handleDirectConnect}
            disabled={isConnecting}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 w-full"
          >
            {isConnecting ? 'Conectando...' : '🦊 Conectar MetaMask Diretamente'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded text-sm">
            <strong>Erro:</strong> {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
