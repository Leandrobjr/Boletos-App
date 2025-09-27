import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWalletDetection } from '../hooks/useWalletDetection';

export function WalletDetector() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { 
    isMetaMaskInstalled, 
    isMetaMaskConnected, 
    metaMaskAccount, 
    detectionError,
    connectMetaMask,
    switchToPolygonAmoy
  } = useWalletDetection();
  const [walletStatus, setWalletStatus] = useState('checking');
  const [availableWallets, setAvailableWallets] = useState([]);

  useEffect(() => {
    checkWalletAvailability();
  }, []);

  const checkWalletAvailability = async () => {
    const wallets = [];
    
    // Verificar MetaMask usando o hook personalizado
    wallets.push({
      name: 'MetaMask',
      available: isMetaMaskInstalled,
      id: 'metaMask',
      message: isMetaMaskInstalled ? null : 'MetaMask não detectado. Instale a extensão.',
      connected: isMetaMaskConnected,
      account: metaMaskAccount
    });

    setAvailableWallets(wallets);
    setWalletStatus('checked');
  };

  const handleConnect = async (connectorId) => {
    try {
      if (connectorId === 'metaMask') {
        // Usar conexão direta do MetaMask
        const result = await connectMetaMask();
        if (result.success) {
          // Trocar para Polygon Amoy
          await switchToPolygonAmoy();
        }
      } else {
        // Usar Wagmi para outras carteiras
        const connector = connectors.find(c => c.id === connectorId);
        if (connector) {
          await connect({ connector });
        }
      }
    } catch (error) {
      console.error('Erro ao conectar carteira:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (walletStatus === 'checking') {
    return (
      <div className="bg-yellow-100 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-2">🔍 Verificando Carteiras...</h3>
        <div className="text-sm">Detectando carteiras disponíveis...</div>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 p-4 rounded-lg mb-4 border-2 border-blue-400">
      <h3 className="text-lg font-semibold mb-2">🔗 Status da Carteira</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? '✅ Conectado' : '❌ Desconectado'}
          </span>
        </div>

        {isConnected && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Endereço:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Nenhum'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Carteira:</span>
              <span className="text-sm">{connector?.name || 'Desconhecida'}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Carteiras Disponíveis:</h4>
          {availableWallets.map((wallet) => (
            <div key={wallet.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  wallet.available ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="font-medium">{wallet.name}</span>
                {wallet.connected && (
                  <span className="text-xs text-green-600">(Conectado)</span>
                )}
                {!wallet.available && (
                  <span className="text-xs text-red-600">{wallet.message}</span>
                )}
              </div>
              {wallet.available && !wallet.connected && (
                <button
                  onClick={() => handleConnect(wallet.id)}
                  disabled={isPending}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  {isPending ? 'Conectando...' : 'Conectar'}
                </button>
              )}
            </div>
          ))}
        </div>

        {detectionError && (
          <div className="bg-red-100 text-red-800 p-3 rounded text-sm">
            <strong>Erro de Detecção:</strong> {detectionError}
          </div>
        )}

        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Desconectar
          </button>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded text-sm">
            <strong>Erro:</strong> {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
