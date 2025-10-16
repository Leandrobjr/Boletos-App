/**
 * 🌍 REFRESH UNIVERSAL PARA TODAS AS CARTEIRAS
 * 
 * Detecta automaticamente o tipo de carteira e aplica métodos específicos
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';

const UniversalWalletRefresher = ({ address }) => {
  const [walletType, setWalletType] = useState('unknown');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  // Detectar tipo de carteira
  useEffect(() => {
    const detectWalletType = () => {
      if (!window.ethereum) {
        setWalletType('none');
        return;
      }

      // Rabby Wallet
      if (window.ethereum.isRabby || window.ethereum._rabby) {
        setWalletType('rabby');
        return;
      }

      // MetaMask
      if (window.ethereum.isMetaMask) {
        setWalletType('metamask');
        return;
      }

      // Coinbase Wallet
      if (window.ethereum.isCoinbaseWallet) {
        setWalletType('coinbase');
        return;
      }

      // Generic
      setWalletType('generic');
    };

    detectWalletType();
  }, []);

  const refreshForRabby = async () => {
    console.log('🦊 [UNIVERSAL] Aplicando métodos específicos para Rabby...');
    
    // Métodos específicos para Rabby
    const methods = [
      // 1. Re-request accounts
      async () => {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return 'Contas revalidadas';
      },
      
      // 2. Request permissions
      async () => {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        return 'Permissões atualizadas';
      },
      
      // 3. Add USDT token
      async () => {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
              symbol: 'USDT',
              decimals: 6
            }
          }
        });
        return 'Token USDT reconhecido';
      },
      
      // 4. Force balance check
      async () => {
        await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        return 'Saldo consultado';
      }
    ];

    return methods;
  };

  const refreshForMetaMask = async () => {
    console.log('🦊 [UNIVERSAL] Aplicando métodos específicos para MetaMask...');
    
    const methods = [
      // 1. Network switch trick
      async () => {
        const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(currentChain, 16) === 80002) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }]
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }]
          });
        }
        return 'Rede alternada';
      },
      
      // 2. Token watch
      async () => {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
              symbol: 'USDT',
              decimals: 6
            }
          }
        });
        return 'Token adicionado';
      }
    ];

    return methods;
  };

  const refreshForGeneric = async () => {
    console.log('🔧 [UNIVERSAL] Aplicando métodos genéricos...');
    
    const methods = [
      async () => {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return 'Contas solicitadas';
      },
      async () => {
        await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        return 'Saldo verificado';
      }
    ];

    return methods;
  };

  const executeUniversalRefresh = async () => {
    if (!window.ethereum || !address) return;

    setIsRefreshing(true);
    setMessage('');

    try {
      let methods = [];
      let walletName = '';

      switch (walletType) {
        case 'rabby':
          methods = await refreshForRabby();
          walletName = 'Rabby';
          break;
        case 'metamask':
          methods = await refreshForMetaMask();
          walletName = 'MetaMask';
          break;
        default:
          methods = await refreshForGeneric();
          walletName = 'Generic';
          break;
      }

      console.log(`🔄 [UNIVERSAL] Executando ${methods.length} métodos para ${walletName}...`);
      
      const results = [];
      for (const method of methods) {
        try {
          const result = await method();
          results.push(result);
          console.log(`✅ [UNIVERSAL] ${result}`);
        } catch (error) {
          console.log(`⚠️ [UNIVERSAL] Método falhou:`, error.message);
        }
      }

      setMessage(`✅ ${walletName}: ${results.join(', ')}`);

    } catch (error) {
      console.error('❌ [UNIVERSAL] Erro geral:', error);
      setMessage('❌ Erro no refresh universal');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getWalletDisplayName = () => {
    switch (walletType) {
      case 'rabby': return '🦊 Rabby';
      case 'metamask': return '🦊 MetaMask';
      case 'coinbase': return '🔵 Coinbase';
      case 'generic': return '🔧 Genérica';
      case 'none': return '❌ Nenhuma';
      default: return '❓ Desconhecida';
    }
  };

  if (!address || walletType === 'none') return null;

  return (
    <div style={{
      backgroundColor: '#ecfdf5',
      border: '1px solid #10b981',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div>
          <div style={{
            color: '#065f46',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            🌍 Refresh Universal de Saldo
          </div>
          <div style={{
            fontSize: '12px',
            color: '#047857'
          }}>
            Carteira: {getWalletDisplayName()}
          </div>
        </div>
        
        <button
          onClick={executeUniversalRefresh}
          disabled={isRefreshing}
          style={{
            backgroundColor: isRefreshing ? '#94a3b8' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {isRefreshing ? '🔄 Executando...' : '🚀 Refresh Inteligente'}
        </button>
      </div>
      
      {message && (
        <div style={{
          fontSize: '11px',
          color: '#065f46',
          backgroundColor: '#f0fdf4',
          padding: '6px',
          borderRadius: '4px',
          marginTop: '8px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{
        fontSize: '11px',
        color: '#047857',
        lineHeight: '1.4',
        marginTop: '8px'
      }}>
        🎯 <strong>Refresh inteligente</strong> - detecta sua carteira e aplica os métodos mais eficazes para forçar atualização do saldo.
      </div>
    </div>
  );
};

export default UniversalWalletRefresher;

