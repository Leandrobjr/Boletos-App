import React, { useState } from 'react';
import { useBoletoEscrowRobust } from '../hooks/useBoletoEscrowRobust';

const TestRobustConnection = () => {
  const { createEscrow, isCreatingEscrow, error } = useBoletoEscrowRobust();
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    try {
      setTestResult('🔄 Testando conexão robusta...');
      
      // Dados de teste com valor real do boleto
      const testData = {
        valorUSDT: 122.07, // Valor real do boleto (122.07 USDT + 2% taxa = 124.51 USDT total)
        codigoBarras: 'TEST' + Date.now(),
        descricao: 'Teste de conexão robusta'
      };

      console.log('🧪 Iniciando teste de conexão robusta...');
      const result = await createEscrow(testData);
      
      setTestResult(`✅ Sucesso! Hash: ${result.hash}`);
      console.log('✅ Teste concluído com sucesso:', result);
    } catch (err) {
      setTestResult(`❌ Erro: ${err.message}`);
      console.error('❌ Teste falhou:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #4CAF50', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🧪 Teste de Conexão Robusta</h3>
      <p>Este teste verifica se o sistema de retry e fallback de RPC está funcionando.</p>
      
      <button 
        onClick={handleTest}
        disabled={isCreatingEscrow}
        style={{
          padding: '10px 20px',
          backgroundColor: isCreatingEscrow ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isCreatingEscrow ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isCreatingEscrow ? '🔄 Testando...' : '🚀 Testar Conexão Robusta'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#d32f2f'
        }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {testResult && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: testResult.includes('✅') ? '#e8f5e8' : '#ffebee',
          border: `1px solid ${testResult.includes('✅') ? '#4CAF50' : '#f44336'}`,
          borderRadius: '4px',
          color: testResult.includes('✅') ? '#2e7d32' : '#d32f2f'
        }}>
          <strong>Resultado:</strong> {testResult}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <h4>🔧 Melhorias Implementadas:</h4>
        <ul>
          <li>✅ Sistema de retry automático (3 tentativas)</li>
          <li>✅ Múltiplos RPC providers com fallback</li>
          <li>✅ Timeout de 5 segundos para RPCs</li>
          <li>✅ Detecção automática de erros -32603</li>
          <li>✅ Priorização do Rabby Wallet</li>
          <li>✅ Validação robusta de contratos</li>
        </ul>
      </div>
    </div>
  );
};

export default TestRobustConnection;
