import React from 'react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { useWriteContract } from 'wagmi';
import { CONTRACT_CONFIG } from '../contracts/config';
import MOCK_USDT_ABI from '../contracts/abis/MockUSDT.json';

export function WagmiConfigTest() {
  // Teste básico do Wagmi
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  // Teste com useWriteContract
  const { writeContractAsync, isError, error, isPending } = useWriteContract();

  console.log('🔍 [WAGMI-TEST] WagmiConfigTest renderizado');
  console.log('🔍 [WAGMI-TEST] address:', address);
  console.log('🔍 [WAGMI-TEST] isConnected:', isConnected);
  console.log('🔍 [WAGMI-TEST] chainId:', chainId);
  console.log('🔍 [WAGMI-TEST] config:', config);
  console.log('🔍 [WAGMI-TEST] useWriteContract completo:', { writeContractAsync, isError, error, isPending });

  return (
    <div className="bg-red-100 p-4 rounded-lg mb-4 border-2 border-red-400">
      <h3 className="text-lg font-semibold mb-2">🧪 Teste de Configuração do Wagmi</h3>
      
      <div className="text-sm space-y-2">
        <div><strong>Endereço:</strong> {address || 'Nenhum'}</div>
        <div><strong>Conectado:</strong> {isConnected ? '✅' : '❌'}</div>
        <div><strong>Chain ID:</strong> {chainId || 'Nenhum'}</div>
        <div><strong>Config:</strong> {config ? '✅' : '❌'}</div>
        
        <div className="mt-3">
          <strong>useWriteContract:</strong>
          <div className="ml-2 text-xs">
            <div>writeContractAsync: {writeContractAsync ? '✅' : '❌'}</div>
            <div>isError: {isError ? '❌' : '✅'}</div>
            <div>isPending: {isPending ? '⏳' : '✅'}</div>
            <div>error: {error ? error.message : 'Nenhum'}</div>
          </div>
        </div>

        <div className="mt-3">
          <strong>Configuração MockUSDT:</strong>
          <div className="ml-2 text-xs">
            <div>Decimals: {CONTRACT_CONFIG?.TOKENS?.MOCK_USDT?.decimals || 'N/A'}</div>
            <div>Endereço: {CONTRACT_CONFIG?.MOCK_USDT || 'N/A'}</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          console.log('🔍 [WAGMI-TEST] Estado completo:', {
            address,
            isConnected,
            chainId,
            config,
            useWriteContract: { writeContractAsync, isError, error, isPending }
          });
        }}
        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 mt-2"
      >
        Log Estado Completo
      </button>
    </div>
  );
}
