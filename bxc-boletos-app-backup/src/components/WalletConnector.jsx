import { useState } from 'react';
import { FaWallet, FaEthereum, FaExchangeAlt, FaCoins } from 'react-icons/fa';

function WalletConnector({ onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Simulação de conexão com carteira
  const connectWallet = async (walletType) => {
    setIsConnecting(true);
    
    try {
      // Simulação de delay para conectar
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Endereço simulado de carteira
      const address = `0x${Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // Saldo simulado
      const balance = (Math.random() * 10).toFixed(4);
      
      setWalletAddress(address);
      setWalletBalance(balance);
      
      if (onConnect) {
        onConnect({ address, balance, type: walletType });
      }
      
      setShowWalletModal(false);
    } catch (error) {
      console.error('Erro ao conectar carteira:', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnectWallet = () => {
    setWalletAddress('');
    setWalletBalance(null);
    
    if (onConnect) {
      onConnect(null);
    }
  };
  
  // Função para formatar endereço da carteira
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <>
      {walletAddress ? (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <FaWallet className="text-green-600" />
          <div className="text-sm">
            <div className="font-medium text-green-700">{formatAddress(walletAddress)}</div>
            <div className="text-green-600">{walletBalance} USDT</div>
          </div>
          <button 
            onClick={disconnectWallet}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowWalletModal(true)}
          className="flex items-center space-x-1 bg-secondary hover:bg-secondary/90 text-white px-3 py-2 rounded-md transition-colors"
        >
          <FaWallet />
          <span>Conectar Carteira</span>
        </button>
      )}
      
      {/* Modal de seleção de carteira */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Conectar Carteira</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => connectWallet('metamask')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-full mr-3">
                    <FaEthereum className="text-orange-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">MetaMask</div>
                    <div className="text-xs text-gray-500">Conecte-se à sua carteira MetaMask</div>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={() => connectWallet('walletconnect')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FaExchangeAlt className="text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">WalletConnect</div>
                    <div className="text-xs text-gray-500">Escaneie o QR code com seu app de carteira</div>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={() => connectWallet('coinbase')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FaCoins className="text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Coinbase Wallet</div>
                    <div className="text-xs text-gray-500">Conecte-se usando Coinbase Wallet</div>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {isConnecting && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
                <p className="mt-2 text-gray-600">Conectando à carteira...</p>
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-500">
              <p>Ao conectar sua carteira, você concorda com os nossos Termos de Serviço e Política de Privacidade.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WalletConnector;
