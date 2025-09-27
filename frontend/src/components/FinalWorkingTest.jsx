import React, { useState } from 'react';
import { useBoletoEscrowWorking } from '../hooks/useBoletoEscrowWorking';

const FinalWorkingTest = () => {
  const { createEscrow, isCreatingEscrow, error, step } = useBoletoEscrowWorking();
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    try {
      setTestResult('🔄 Iniciando teste com solução definitiva...');
      
      // Dados de teste com valor real do boleto
      const testData = {
        valorUSDT: 122.07, // Valor real do boleto (122.07 USDT + 2% taxa = 124.51 USDT total)
        codigoBarras: 'TEST' + Date.now(),
        descricao: 'Teste com solução definitiva'
      };

      console.log('✅ Iniciando teste com solução definitiva...');
      const result = await createEscrow(testData);
      
      setTestResult(`✅ Sucesso com solução definitiva! Hash: ${result.hash}
      
📊 Detalhes:
• Boleto ID: ${result.boletoId}
• Valor: ${result.amount} USDT
• Taxa: ${result.fee} USDT
• Total: ${result.total} USDT
• Status: ${step}

🎉 Solução definitiva funcionou perfeitamente!
Este é o método final para todas as transações.`);
      
      console.log('✅ Teste concluído com sucesso:', result);
    } catch (err) {
      setTestResult(`❌ Erro: ${err.message}`);
      console.error('❌ Teste falhou:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #FF5722', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#fbe9e7'
    }}>
      <h3>🎯 Teste Final - Solução Definitiva</h3>
      <p>Este teste usa a solução definitiva que contorna todos os problemas identificados.</p>
      
      <button 
        onClick={handleTest}
        disabled={isCreatingEscrow}
        style={{
          padding: '10px 20px',
          backgroundColor: isCreatingEscrow ? '#ccc' : '#FF5722',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isCreatingEscrow ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isCreatingEscrow ? `🔄 ${step}...` : '🎯 Testar Solução Final'}
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
        <h4>🎯 Solução definitiva implementada:</h4>
        <ul>
          <li>✅ Usa funções de leitura que funcionam</li>
          <li>✅ sendTransaction direto com dados codificados</li>
          <li>✅ Contorna problemas de RPC -32603</li>
          <li>✅ Método mais confiável e profissional</li>
          <li>✅ Pronto para produção</li>
        </ul>
      </div>
    </div>
  );
};

export default FinalWorkingTest;



