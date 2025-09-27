import React from 'react';
import { useWriteContract, useAccount, useChainId } from 'wagmi';
import { CONTRACT_CONFIG } from '../contracts/config';
import MOCK_USDT_ABI from '../contracts/abis/MockUSDT.json';

export function WriteContractTest() {
  // Teste com useWriteContract (API mais recente do Wagmi v2)
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const { writeContractAsync, isError, error, isPending } = useWriteContract();

  console.log('🔍 [WRITE-TEST] WriteContractTest renderizado');
  console.log('🔍 [WRITE-TEST] address:', address);
  console.log('🔍 [WRITE-TEST] chainId:', chainId);
  console.log('🔍 [WRITE-TEST] writeContractAsync:', writeContractAsync);
  console.log('🔍 [WRITE-TEST] isError:', isError);
  console.log('🔍 [WRITE-TEST] error:', error);
  console.log('🔍 [WRITE-TEST] isPending:', isPending);

  const handleTestWrite = async () => {
    if (!writeContractAsync) {
      console.error('❌ [WRITE-TEST] writeContractAsync não está disponível');
      return;
    }

    try {
      console.log('🔄 [WRITE-TEST] Tentando escrever contrato...');
      
      // CORREÇÃO: MockUSDT tem 6 decimais!
      const result = await writeContractAsync({
        address: CONTRACT_CONFIG.MOCK_USDT,
        abi: MOCK_USDT_ABI,
        functionName: 'approve',
        args: [CONTRACT_CONFIG.P2P_ESCROW, '1000000'] // 1 USDT em 6 decimais
      });
      
      console.log('✅ [WRITE-TEST] Contrato escrito com sucesso:', result);
    } catch (error) {
      console.error('❌ [WRITE-TEST] Erro ao escrever contrato:', error);
    }
  };

  return (
    <div className="bg-purple-100 p-4 rounded-lg mb-4 border-2 border-purple-400">
      <h3 className="text-lg font-semibold mb-2">🧪 Teste com useWriteContract (Wagmi v2)</h3>
      
      <div className="text-sm space-y-2">
        <div><strong>Endereço:</strong> {address || 'Nenhum'}</div>
        <div><strong>Conectado:</strong> {isConnected ? '✅' : '❌'}</div>
        <div><strong>Chain ID:</strong> {chainId || 'Nenhum'}</div>
        
        <div className="mt-3">
          <strong>useWriteContract:</strong>
          <div className="ml-2 text-xs">
            <div>writeContractAsync: {writeContractAsync ? '✅' : '❌'}</div>
            <div>isError: {isError ? '❌' : '✅'}</div>
            <div>isPending: {isPending ? '⏳' : '✅'}</div>
            <div>error: {error ? error.message : 'Nenhum'}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleTestWrite}
          disabled={!writeContractAsync || isPending}
          className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
        >
          Testar Write Contract
        </button>
        
        <button
          onClick={() => {
            console.log('🔍 [WRITE-TEST] Estado completo:', {
              address,
              isConnected,
              chainId,
              writeContractAsync,
              isError,
              error,
              isPending
            });
          }}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
        >
          Log Estado
        </button>
      </div>
    </div>
  );
}
