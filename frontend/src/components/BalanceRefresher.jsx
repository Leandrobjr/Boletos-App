/**
 * 🔄 COMPONENTE DE REFRESH AUTOMÁTICO DE SALDOS
 * 
 * Solução definitiva para problemas de cache de carteiras
 * 
 * @author Engenheiro Sênior
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const DEV_CONFIG = {
  MOCK_USDT: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
  NETWORK: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology'
  }
};

const BalanceRefresher = ({ address, onBalanceUpdate, isBackgroundMode = false }) => {
  const [balance, setBalance] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const forceRefreshBalance = async () => {
    if (!address) return;

    setIsRefreshing(true);
    try {
      if (!isBackgroundMode) {
        console.log('🔄 [BALANCE] Forçando refresh para:', address);
      }

      // Método 1: Usar RPC direto (bypass cache da carteira)
      const provider = new ethers.JsonRpcProvider(DEV_CONFIG.NETWORK.rpcUrl);
      const mockUSDT = new ethers.Contract(
        DEV_CONFIG.MOCK_USDT,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );

      const rawBalance = await mockUSDT.balanceOf(address);
      const formattedBalance = ethers.formatUnits(rawBalance, 6);
      
      if (!isBackgroundMode) {
        console.log('💰 [BALANCE] Saldo real na blockchain:', formattedBalance, 'USDT');
      }
      
      setBalance(formattedBalance);
      setLastUpdate(new Date().toLocaleTimeString());

      // Método 2: Forçar refresh da carteira silenciosamente (se disponível)
      if (window.ethereum) {
        try {
          // Detectar tipo de carteira e aplicar método apropriado
          if (window.ethereum.isRabby || window.ethereum._rabby) {
            // Rabby: re-request permissions silenciosamente
            await window.ethereum.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            });
          } else {
            // MetaMask/outros: request accounts
            await window.ethereum.request({ method: 'eth_requestAccounts' });
          }
          
          if (!isBackgroundMode) {
            console.log('🔄 [BALANCE] Carteira atualizada silenciosamente');
          }
        } catch (error) {
          // Silencioso em background mode
          if (!isBackgroundMode) {
            console.log('⚠️ [BALANCE] Refresh silencioso não disponível:', error.message);
          }
        }
      }

      if (onBalanceUpdate) {
        onBalanceUpdate(formattedBalance);
      }

    } catch (error) {
      if (!isBackgroundMode) {
        console.error('❌ [BALANCE] Erro ao atualizar saldo:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!address) return;

    forceRefreshBalance(); // Inicial
    
    const interval = setInterval(() => {
      forceRefreshBalance();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [address]);

  if (!address) return null;

  // Modo background: componente invisível
  if (isBackgroundMode) {
    return null;
  }

  // Modo normal: interface visível
  return (
    <div style={{
      backgroundColor: '#f0f9ff',
      border: '1px solid #0ea5e9',
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
            color: '#0c4a6e',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            💰 Saldo USDT Real
          </div>
          <div style={{
            fontSize: '18px',
            color: '#075985',
            fontWeight: '600'
          }}>
            {balance ? `${balance} USDT` : 'Carregando...'}
          </div>
          {lastUpdate && (
            <div style={{
              fontSize: '11px',
              color: '#0369a1'
            }}>
              Atualizado: {lastUpdate}
            </div>
          )}
        </div>
        
        <button
          onClick={forceRefreshBalance}
          disabled={isRefreshing}
          style={{
            backgroundColor: isRefreshing ? '#94a3b8' : '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {isRefreshing ? '🔄 Atualizando...' : '🔄 Refresh'}
        </button>
      </div>
      
      <div style={{
        fontSize: '11px',
        color: '#0369a1',
        lineHeight: '1.4',
        backgroundColor: '#e0f2fe',
        padding: '6px',
        borderRadius: '4px'
      }}>
        ✅ <strong>Saldo direto da blockchain</strong> - ignora cache das carteiras
      </div>
    </div>
  );
};

export default BalanceRefresher;
