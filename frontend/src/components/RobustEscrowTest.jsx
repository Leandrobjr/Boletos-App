import React, { useState } from 'react';
import { useBoletoEscrowRobust } from '../hooks/useBoletoEscrowRobust';
import { CONTRACT_CONFIG } from '../contracts/config.js';

const RobustEscrowTest = ({ userAddress, formData }) => {
  const { createEscrow, isCreatingEscrow, error } = useBoletoEscrowRobust();
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    try {
      setResult(null);
      const result = await createEscrow(formData, userAddress);
      setResult(result);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #4CAF50', 
      borderRadius: '8px', 
      margin: '20px 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>
        🚀 Teste Robusto de Escrow
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Contratos V2:</strong>
        <br />
        MockUSDT: <code>{CONTRACT_CONFIG.MOCK_USDT}</code>
        <br />
        P2PEscrow: <code>{CONTRACT_CONFIG.P2P_ESCROW}</code>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Dados do Formulário:</strong>
        <br />
        Código de Barras: <code>{formData?.codigoBarras || 'N/A'}</code>
        <br />
        Valor USDT: <code>{formData?.valorUSDT || 'N/A'}</code>
      </div>

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
        {isCreatingEscrow ? '🔄 Processando...' : '🚀 Testar Escrow Robusto'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#d32f2f'
        }}>
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: result.error ? '#ffebee' : '#e8f5e8', 
          border: `1px solid ${result.error ? '#f44336' : '#4CAF50'}`,
          borderRadius: '4px',
          color: result.error ? '#d32f2f' : '#2e7d32'
        }}>
          {result.error ? (
            <>
              <strong>❌ Erro:</strong> {result.error}
            </>
          ) : (
            <>
              <strong>✅ Sucesso!</strong>
              <br />
              Transfer Hash: <code>{result.transferHash}</code>
              <br />
              Escrow Hash: <code>{result.escrowHash}</code>
              <br />
              {result.message}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RobustEscrowTest;
