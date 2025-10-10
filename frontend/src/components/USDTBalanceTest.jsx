import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_CONFIG } from '../contracts/config';
import MOCK_USDT_ABI from '../contracts/abis/MockUSDT.json';
import { buildApiUrl } from '../config/apiConfig';

export function USDTBalanceTest() {
  const { address, isConnected } = useAccount();
  const [directConnection, setDirectConnection] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificar conexão direta
  useEffect(() => {
    const checkDirectConnection = async () => {
      if (!isConnected && typeof window !== 'undefined' && window.ethereum) {
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
    
    checkDirectConnection();
    const interval = setInterval(checkDirectConnection, 2000);
    
    return () => clearInterval(interval);
  }, [isConnected]);

  const actualIsConnected = isConnected || directConnection?.isConnected;
  const actualAddress = address || directConnection?.address;

  // Hook para ler saldo USDT
  const { data: usdtBalance, isLoading: balanceLoading, error: balanceError } = useReadContract({
    address: CONTRACT_CONFIG.MOCK_USDT,
    abi: MOCK_USDT_ABI,
    functionName: 'balanceOf',
    args: actualAddress ? [actualAddress] : undefined,
    query: {
      enabled: !!actualAddress,
      refetchInterval: 5000
    }
  });

  const checkBalance = async () => {
    if (!actualAddress) return;
    
    setLoading(true);
    try {
      // Verificar saldo via RPC direto
      const response = await fetch(buildApiUrl('/rpc-proxy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: CONTRACT_CONFIG.MOCK_USDT,
            data: `0x70a08231000000000000000000000000${actualAddress.slice(2)}`
          }, 'latest'],
          id: 1
        })
      });
      
      const result = await response.json();
      if (result.result) {
        const balanceHex = result.result;
        const balanceWei = BigInt(balanceHex);
        const balanceUSDT = Number(balanceWei) / Math.pow(10, 6); // 6 decimais
        setBalance(balanceUSDT);
        console.log('💰 [BALANCE] Saldo USDT:', balanceUSDT);
      }
    } catch (error) {
      console.error('❌ [BALANCE] Erro ao verificar saldo:', error);
    } finally {
      setLoading(false);
    }
  };

  const mintUSDT = async () => {
    if (!actualAddress) return;
    
    setLoading(true);
    try {
      console.log('🪙 [MINT] Solicitando mint de USDT...');
      
      // Chamar função mint do MockUSDT
      const response = await fetch(buildApiUrl('/rpc-proxy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [{
            from: actualAddress,
            to: CONTRACT_CONFIG.MOCK_USDT,
            data: `0x40c10f19000000000000000000000000${actualAddress.slice(2)}00000000000000000000000000000000000000000000000000000000000f4240` // mint 1 USDT
          }],
          id: 1
        })
      });
      
      const result = await response.json();
      console.log('🪙 [MINT] Resultado:', result);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      alert('Mint solicitado! Confirme no MetaMask.');
    } catch (error) {
      console.error('❌ [MINT] Erro ao solicitar mint:', error);
      alert(`Erro ao solicitar mint: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!actualIsConnected) {
    return (
      <div className="bg-yellow-100 p-4 rounded-lg mb-4 border-2 border-yellow-400">
        <h3 className="text-lg font-semibold mb-2">⚠️ Carteira Não Conectada</h3>
        <p>Conecte uma carteira para verificar o saldo USDT.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 p-4 rounded-lg mb-4 border-2 border-blue-400">
      <h3 className="text-lg font-semibold mb-2">💰 Teste de Saldo USDT</h3>
      
      <div className="space-y-3">
        <div className="text-sm">
          <strong>Endereço:</strong> {actualAddress ? `${actualAddress.slice(0, 6)}...${actualAddress.slice(-4)}` : 'Nenhum'}
        </div>
        
        <div className="text-sm">
          <strong>Saldo USDT (Wagmi):</strong> {
            balanceLoading ? 'Carregando...' : 
            balanceError ? `Erro: ${balanceError.message}` :
            usdtBalance ? `${(Number(usdtBalance) / Math.pow(10, 6)).toFixed(6)} USDT` :
            'N/A'
          }
        </div>
        
        <div className="text-sm">
          <strong>Saldo USDT (RPC):</strong> {
            loading ? 'Verificando...' :
            balance !== null ? `${balance.toFixed(6)} USDT` :
            'Não verificado'
          }
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={checkBalance}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Saldo'}
          </button>
          
          <button
            onClick={mintUSDT}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Mintando...' : 'Mint 1 USDT'}
          </button>
        </div>
        
        <div className="text-xs text-gray-600">
          <strong>Contrato USDT:</strong> {CONTRACT_CONFIG.MOCK_USDT}
        </div>
      </div>
    </div>
  );
}

