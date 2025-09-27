import { useState, useEffect } from 'react';

export function useWalletDetection() {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState(null);
  const [detectionError, setDetectionError] = useState(null);

  useEffect(() => {
    detectMetaMask();
  }, []);

  const detectMetaMask = async () => {
    try {
      // Verificar se window.ethereum existe
      if (typeof window === 'undefined') {
        setIsMetaMaskInstalled(false);
        setDetectionError('Ambiente sem window');
        return;
      }

      // Caso múltiplos providers, escolher explicitamente o MetaMask
      const provider = Array.isArray(window.ethereum?.providers)
        ? window.ethereum.providers.find((p) => p?.isMetaMask)
        : window.ethereum;

      if (!provider) {
        setIsMetaMaskInstalled(false);
        setDetectionError('MetaMask não detectado. Verifique se a extensão está instalada.');
        return;
      }

      // Verificar se é MetaMask especificamente
      const isMetaMask = provider.isMetaMask;
      if (!isMetaMask) {
        setIsMetaMaskInstalled(false);
        setDetectionError('MetaMask não detectado. Outra carteira pode estar ativa.');
        return;
      }

      setIsMetaMaskInstalled(true);
      setDetectionError(null);

      // Verificar se já está conectado
      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsMetaMaskConnected(true);
          setMetaMaskAccount(accounts[0]);
        } else {
          setIsMetaMaskConnected(false);
          setMetaMaskAccount(null);
        }
      } catch (error) {
        console.warn('Erro ao verificar contas MetaMask:', error);
        setIsMetaMaskConnected(false);
        setMetaMaskAccount(null);
      }

      // Listener para mudanças de conta
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setIsMetaMaskConnected(true);
          setMetaMaskAccount(accounts[0]);
        } else {
          setIsMetaMaskConnected(false);
          setMetaMaskAccount(null);
        }
      };

      // Listener para mudanças de rede
      const handleChainChanged = (chainId) => {
        console.log('Rede alterada:', chainId);
        // Recarregar a página para garantir que a nova rede seja detectada
        window.location.reload();
      };

      // Adicionar listeners
      provider.on?.('accountsChanged', handleAccountsChanged);
      provider.on?.('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
        }
      };

    } catch (error) {
      console.error('Erro ao detectar MetaMask:', error);
      setDetectionError(`Erro na detecção: ${error.message}`);
      setIsMetaMaskInstalled(false);
    }
  };

  const connectMetaMask = async () => {
    try {
      if (!isMetaMaskInstalled) {
        throw new Error('MetaMask não está instalado');
      }

      const provider = Array.isArray(window.ethereum?.providers)
        ? window.ethereum.providers.find((p) => p?.isMetaMask)
        : window.ethereum;

      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setIsMetaMaskConnected(true);
        setMetaMaskAccount(accounts[0]);
        return { success: true, account: accounts[0] };
      } else {
        throw new Error('Nenhuma conta foi conectada');
      }
    } catch (error) {
      console.error('Erro ao conectar MetaMask:', error);
      setDetectionError(`Erro na conexão: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const switchToPolygonAmoy = async () => {
    try {
      if (!isMetaMaskInstalled) {
        throw new Error('MetaMask não está instalado');
      }

      const provider = Array.isArray(window.ethereum?.providers)
        ? window.ethereum.providers.find((p) => p?.isMetaMask)
        : window.ethereum;

      // Chain ID do Polygon Amoy
      const polygonAmoyChainId = '0x13882'; // 80002 em decimal

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: polygonAmoyChainId }],
      });

      return { success: true };
    } catch (error) {
      // Se a rede não estiver adicionada, tentar adicionar
      if (error.code === 4902) {
        try {
          await provider.request({
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
          return { success: true };
        } catch (addError) {
          console.error('Erro ao adicionar rede Polygon Amoy:', addError);
          return { success: false, error: addError.message };
        }
      } else {
        console.error('Erro ao trocar para Polygon Amoy:', error);
        return { success: false, error: error.message };
      }
    }
  };

  return {
    isMetaMaskInstalled,
    isMetaMaskConnected,
    metaMaskAccount,
    detectionError,
    connectMetaMask,
    switchToPolygonAmoy,
    detectMetaMask
  };
}
