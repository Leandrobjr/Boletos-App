/**
 * 🔧 COMPONENTE SIMPLES DE VERIFICAÇÃO DE CARTEIRAS
 * 
 * Detecta conflitos entre estado da app e extensão
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';

const WalletSyncChecker = ({ currentAddress, onForceReconnect }) => {
  const [walletState, setWalletState] = useState({
    appAddress: currentAddress,
    extensionAddress: null,
    isSynced: true,
    lastCheck: null
  });
  
  const [showAlert, setShowAlert] = useState(false);

  // 🔍 Verificar estado das carteiras
  const checkWalletSync = async () => {
    try {
      let extensionAddress = null;

      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts && accounts.length > 0) {
            extensionAddress = accounts[0];
          }
        } catch (error) {
          console.warn('Erro ao verificar carteiras:', error);
        }
      }

      // Verificar sincronização
      const isSynced = !currentAddress || 
                      !extensionAddress || 
                      currentAddress.toLowerCase() === extensionAddress.toLowerCase();

      setWalletState({
        appAddress: currentAddress,
        extensionAddress,
        isSynced,
        lastCheck: new Date()
      });

      setShowAlert(!isSynced);

    } catch (error) {
      console.error('Erro na verificação de sincronização:', error);
    }
  };

  // 🔄 Forçar reconexão
  const handleForceReconnect = async () => {
    try {
      // Limpar estado local
      localStorage.removeItem('walletConnect');
      localStorage.removeItem('connectedWallet');
      
      // Recarregar página
      window.location.reload();

    } catch (error) {
      console.error('Erro ao forçar reconexão:', error);
    }
  };

  // 🔄 Efeito: Verificação automática
  useEffect(() => {
    checkWalletSync();
    
    // Verificar a cada 5 segundos
    const interval = setInterval(checkWalletSync, 5000);
    
    // Listener para mudanças de conta
    if (window.ethereum) {
      const handleAccountsChanged = () => {
        setTimeout(checkWalletSync, 500);
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        clearInterval(interval);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
    
    return () => clearInterval(interval);
  }, [currentAddress]);

  // 🎨 Formatador de endereço
  const formatAddress = (address) => {
    if (!address) return 'Não conectado';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 🚨 Se não há problemas, não mostrar nada
  if (!showAlert) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{
          color: '#dc2626',
          fontSize: '18px',
          marginTop: '2px'
        }}>
          ⚠️
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#dc2626',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Conflito de Carteiras Detectado!
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#7f1d1d',
            marginBottom: '12px'
          }}>
            <div>• App conectado: <code>{formatAddress(walletState.appAddress)}</code></div>
            <div>• Extensão ativa: <code>{formatAddress(walletState.extensionAddress)}</code></div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleForceReconnect}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              🔄 Reconectar
            </button>
            
            <button
              onClick={() => setShowAlert(false)}
              style={{
                backgroundColor: 'transparent',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Ignorar
            </button>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#7f1d1d',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #fca5a5'
          }}>
            <div><strong>Como corrigir:</strong></div>
            <div>1. Clique em "Reconectar" acima</div>
            <div>2. Escolha apenas uma extensão de carteira</div>
            <div>3. Conecte com a conta desejada</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSyncChecker;