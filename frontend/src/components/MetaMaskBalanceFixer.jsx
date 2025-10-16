/**
 * 🔧 COMPONENTE PARA FORÇAR ATUALIZAÇÃO DE SALDO NO METAMASK
 * 
 * Solução para problemas específicos de cache do MetaMask
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

import React, { useState } from 'react';

const MetaMaskBalanceFixer = ({ address }) => {
  const [isFixing, setIsFixing] = useState(false);
  const [message, setMessage] = useState('');

  const forceMetaMaskRefresh = async () => {
    if (!window.ethereum || !address) return;

    setIsFixing(true);
    setMessage('');

    try {
      console.log('🔧 [METAMASK] Iniciando correção de saldo...');

      // Método 1: Mudança temporária de rede
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (parseInt(currentChainId, 16) === 80002) { // Amoy
        try {
          // Mudar para Ethereum mainnet temporariamente
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }] // Ethereum mainnet
          });
          
          // Aguardar 1 segundo
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Voltar para Amoy
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }] // Amoy
          });
          
          setMessage('✅ Rede alterada - saldo deve atualizar');
          console.log('✅ [METAMASK] Rede alternada com sucesso');
          
        } catch (networkError) {
          console.log('⚠️ [METAMASK] Não foi possível alterar rede:', networkError.message);
        }
      }

      // Método 2: Revogar e reconectar permissões
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        setMessage('✅ Permissões revalidadas');
        console.log('✅ [METAMASK] Permissões revalidadas');
        
      } catch (permError) {
        console.log('⚠️ [METAMASK] Não foi possível revogar permissões:', permError.message);
      }

      // Método 3: Adicionar token personalizado (força refresh)
      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD', // MockUSDT
              symbol: 'USDT',
              decimals: 6,
              image: ''
            }
          }
        });
        console.log('✅ [METAMASK] Token USDT adicionado/atualizado');
      } catch (tokenError) {
        console.log('⚠️ [METAMASK] Não foi possível adicionar token:', tokenError.message);
      }

      setMessage(prev => prev + ' 🔄 Recarregue a página se necessário');

    } catch (error) {
      console.error('❌ [METAMASK] Erro geral:', error);
      setMessage('❌ Erro ao forçar atualização');
    } finally {
      setIsFixing(false);
    }
  };

  if (!address) return null;

  return (
    <div style={{
      backgroundColor: '#fef7cd',
      border: '1px solid #f59e0b',
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
            color: '#92400e',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            🔧 Corrigir Saldo MetaMask
          </div>
          <div style={{
            fontSize: '12px',
            color: '#78350f'
          }}>
            Se o saldo não atualizou na carteira
          </div>
        </div>
        
        <button
          onClick={forceMetaMaskRefresh}
          disabled={isFixing}
          style={{
            backgroundColor: isFixing ? '#94a3b8' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            cursor: isFixing ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {isFixing ? '🔧 Corrigindo...' : '🔧 Corrigir Saldo'}
        </button>
      </div>
      
      {message && (
        <div style={{
          fontSize: '11px',
          color: '#78350f',
          backgroundColor: '#fef3c7',
          padding: '6px',
          borderRadius: '4px',
          marginTop: '8px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{
        fontSize: '11px',
        color: '#78350f',
        lineHeight: '1.4',
        marginTop: '8px'
      }}>
        Este botão força o MetaMask a atualizar o saldo do token USDT.
        Pode solicitar mudança de rede temporariamente.
      </div>
    </div>
  );
};

export default MetaMaskBalanceFixer;

