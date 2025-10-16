import React, { useState } from 'react';
import { useBoletoEscrow } from '../hooks/useBoletoEscrow';
import { DirectWalletConnector } from './DirectWalletConnector';

export function BoletoTravarTest() {
  const { 
    createEscrow, 
    areHooksReady, 
    isConnected, 
    address,
    hooksStatus 
  } = useBoletoEscrow();

  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestTravar = async () => {
    if (!areHooksReady()) {
      setTestResult({
        success: false,
        error: 'Hooks não estão prontos'
      });
      return;
    }

    if (!isConnected) {
      setTestResult({
        success: false,
        error: 'Carteira não conectada'
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 [TESTE-TRAVAR] Iniciando teste de travamento...');
      
      // Dados de teste - CORRIGIDO: usar endereço real da carteira
      const testData = {
        boletoId: Date.now(), // ← Número (timestamp) em vez de string
        valorUsdt: 1, // 1 USDT (será convertido para 6 decimais = 1000000)
        buyerAddress: address // Usar endereço da carteira conectada
      };

      console.log('🧪 [TESTE-TRAVAR] Dados de teste:', testData);
      console.log('🧪 [TESTE-TRAVAR] Valor em USDT:', testData.valorUsdt);
      console.log('🧪 [TESTE-TRAVAR] Boleto ID (número):', testData.boletoId);
      console.log('🧪 [TESTE-TRAVAR] Será convertido para 6 decimais:', testData.valorUsdt * 1000000);
      
      const result = await createEscrow(testData);
      
      console.log('✅ [TESTE-TRAVAR] Boleto travado com sucesso:', result);
      
      setTestResult({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ [TESTE-TRAVAR] Erro ao travar boleto:', error);
      
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <DirectWalletConnector />
      
      <div className="bg-blue-100 p-4 rounded-lg mb-4 border-2 border-blue-400">
        <h3 className="text-lg font-semibold mb-2">🧪 Teste de Travamento de Boletos</h3>
      
      <div className="text-sm space-y-2 mb-3">
        <div><strong>Status da Carteira:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}</div>
        <div><strong>Endereço:</strong> {address ? `${address.slice(0, 10)}...` : 'Nenhum'}</div>
        <div><strong>Método:</strong> {isConnected ? 'Conectado' : 'Nenhum'}</div>
        <div><strong>Hooks prontos:</strong> {areHooksReady() ? '✅' : '❌'}</div>
        <div><strong>writeContractAsync:</strong> {hooksStatus?.writeContractAsync ? '✅' : '❌'}</div>
        <div><strong>publicClient:</strong> {hooksStatus?.publicClient ? '✅' : '❌'}</div>
      </div>

      <div className="mb-3">
        <strong>Dados de Teste:</strong>
        <div className="text-xs text-gray-600 ml-2">
          <div>Boleto ID: Timestamp atual (número)</div>
          <div>Valor: 1 USDT (6 decimais = 1,000,000)</div>
          <div>Comprador: Endereço da carteira conectada</div>
          <div>Taxa: 3% (0.03 USDT)</div>
          <div>Total: 1.03 USDT (1,030,000 em 6 decimais)</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleTestTravar}
          disabled={!areHooksReady() || !isConnected || isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ Travando...' : '🧪 Testar Travamento'}
        </button>
        
        <button
          onClick={() => {
            console.log('🧪 [TESTE-TRAVAR] Estado completo:', {
              areHooksReady: areHooksReady(),
              isConnected,
              address,
              hooksStatus
            });
          }}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
        >
          Log Estado
        </button>
      </div>

      {testResult && (
        <div className={`p-3 rounded text-sm ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <strong>{testResult.success ? '✅ Sucesso:' : '❌ Erro:'}</strong>
          {testResult.success ? (
            <div className="mt-1">
              <div>Hash: {testResult.data.txHash}</div>
              <div>Escrow ID: {testResult.data.escrowId}</div>
              <div>Valor: {testResult.data.amount} USDT</div>
              <div>Taxa: {testResult.data.fee} USDT</div>
            </div>
          ) : (
            <div className="mt-1">{testResult.error}</div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
