/**
 * 🔧 COMPONENTE DE RECONEXÃO FORÇADA
 * 
 * Solução profissional para problemas de carteira
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

import React from 'react';
import { WalletCacheManager } from '../utils/walletCacheManager.js';

const ForceWalletReconnect = ({ onReconnect, currentAddress }) => {
  const handleForceReconnect = async () => {
    // Usar o gerenciador de cache avançado
    await WalletCacheManager.forceWalletReconnect();
    
    // Recarregar página
    if (onReconnect) {
      onReconnect();
    } else {
      window.location.reload();
    }
  };

  const handleCheckState = () => {
    WalletCacheManager.getCurrentWalletState();
  };

  const formatAddress = (addr) => {
    if (!addr) return 'Não conectado';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div style={{
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{
            color: '#92400e',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            🔧 Conexão de Carteira
          </div>
          <div style={{
            fontSize: '12px',
            color: '#78350f'
          }}>
            Atual: {formatAddress(currentAddress)}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCheckState}
            style={{
              backgroundColor: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0891b2'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#06b6d4'}
          >
            🔍 Verificar
          </button>
          <button
            onClick={handleForceReconnect}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#d97706'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f59e0b'}
          >
            🔄 Reconectar
          </button>
        </div>
      </div>
      
      <div style={{
        fontSize: '11px',
        color: '#78350f',
        lineHeight: '1.4'
      }}>
        Use este botão se a carteira não está conectando corretamente ou se você quer trocar de conta.
      </div>
    </div>
  );
};

export default ForceWalletReconnect;


