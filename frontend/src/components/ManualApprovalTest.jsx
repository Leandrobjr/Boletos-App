import React, { useState } from 'react';
import { useBoletoEscrowManual } from '../hooks/useBoletoEscrowManual';

const ManualApprovalTest = () => {
  const { createEscrow, isCreatingEscrow, error, step } = useBoletoEscrowManual();
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    try {
      setTestResult('🔄 Iniciando teste com aprovação manual...');
      
      // Dados de teste com valor real do boleto
      const testData = {
        valorUSDT: 122.07, // Valor real do boleto (122.07 USDT + 2% taxa = 124.51 USDT total)
        codigoBarras: 'TEST' + Date.now(),
        descricao: 'Teste com aprovação manual'
      };

      console.log('🧪 Iniciando teste com aprovação manual...');
      const result = await createEscrow(testData);
      
      setTestResult(`✅ Sucesso! Hash: ${result.hash}
      
📊 Detalhes:
• Boleto ID: ${result.boletoId}
• Valor: ${result.amount} USDT
• Taxa: ${result.fee} USDT
• Total: ${result.total} USDT`);
      
      console.log('✅ Teste concluído com sucesso:', result);
    } catch (err) {
      setTestResult(`❌ Erro: ${err.message}`);
      console.error('❌ Teste falhou:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #FF9800', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#fff3e0'
    }}>
      <h3>🔧 Teste com Aprovação Manual</h3>
      <p>Este teste usa aprovação manual via MetaMask para contornar problemas de RPC.</p>
      
      <button 
        onClick={handleTest}
        disabled={isCreatingEscrow}
        style={{
          padding: '10px 20px',
          backgroundColor: isCreatingEscrow ? '#ccc' : '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isCreatingEscrow ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isCreatingEscrow ? `🔄 ${step}...` : '🔧 Testar Aprovação Manual'}
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
          color: testResult.includes('✅') ? '#2e7d32' : '#d32f2f',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <strong>Resultado:</strong>
          {testResult}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <h4>🔧 Como funciona:</h4>
        <ul>
          <li>✅ Usa <code>sendTransaction</code> diretamente</li>
          <li>✅ Gas fixo para evitar problemas</li>
          <li>✅ Aprovação manual via MetaMask</li>
          <li>✅ Contorna erros de RPC -32603</li>
          <li>✅ Feedback em tempo real do progresso</li>
        </ul>
      </div>
    </div>
  );
};

export default ManualApprovalTest;


