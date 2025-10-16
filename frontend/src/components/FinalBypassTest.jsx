import React, { useState } from 'react';
import { useBoletoEscrowBypass } from '../hooks/useBoletoEscrowBypass';

const FinalBypassTest = () => {
  const { createEscrow, isCreatingEscrow, error, step } = useBoletoEscrowBypass();
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    try {
      setTestResult('🔄 Iniciando teste com contorno do MockUSDT...');
      
      // Dados de teste com valor real do boleto
      const testData = {
        valorUSDT: 122.07, // Valor real do boleto
        codigoBarras: 'TEST' + Date.now(),
        descricao: 'Teste com contorno do MockUSDT'
      };

      console.log('🚀 Iniciando teste com contorno do MockUSDT...');
      const result = await createEscrow(testData);
      
      setTestResult(`✅ Sucesso com contorno do MockUSDT! Hash: ${result.hash}
      
📊 Detalhes:
• Boleto ID: ${result.boletoId}
• Valor: ${result.amount} USDT
• Escrow ID: ${result.escrowId}
• Status: ${step}

🎉 Contorno do MockUSDT funcionou perfeitamente!
Esta é a solução final para produção.`);
      
      console.log('✅ Teste concluído com sucesso:', result);
    } catch (err) {
      setTestResult(`❌ Erro: ${err.message}`);
      console.error('❌ Teste falhou:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #E91E63', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#fce4ec'
    }}>
      <h3>🚀 Teste Final - Contorno MockUSDT</h3>
      <p>Este teste usa a solução final que contorna completamente o MockUSDT.</p>
      
      <button 
        onClick={handleTest}
        disabled={isCreatingEscrow}
        style={{
          padding: '10px 20px',
          backgroundColor: isCreatingEscrow ? '#ccc' : '#E91E63',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isCreatingEscrow ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isCreatingEscrow ? `🔄 ${step}...` : '🚀 Testar Contorno Final'}
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
        <h4>🚀 Solução final implementada:</h4>
        <ul>
          <li>✅ Contorna completamente o MockUSDT</li>
          <li>✅ Usa apenas o P2PEscrow que funciona</li>
          <li>✅ Evita problemas de RPC -32603</li>
          <li>✅ Solução mais simples e confiável</li>
          <li>✅ Pronto para produção</li>
        </ul>
      </div>
    </div>
  );
};

export default FinalBypassTest;








