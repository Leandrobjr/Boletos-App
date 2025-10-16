import React, { useState } from 'react';
import { useBoletoEscrowFinal } from '../hooks/useBoletoEscrowFinal';
import { CONTRACT_CONFIG } from '../contracts/config.js';

const FinalEscrowTest = ({ userAddress, formData }) => {
  const { createEscrow, isCreatingEscrow, error } = useBoletoEscrowFinal();
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    try {
      setResult(null);
      const result = await createEscrow(formData);
      setResult(result);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #2563eb', 
      borderRadius: '8px', 
      margin: '20px 0',
      backgroundColor: '#f8fafc'
    }}>
      <h3 style={{ color: '#2563eb', marginBottom: '15px' }}>
        🎯 Teste Final de Escrow - Nova Versão Otimizada
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Contratos V2 (Transfer Direto):</strong>
        <br />
        MockUSDT: <code>{CONTRACT_CONFIG.MOCK_USDT}</code>
        <br />
        P2PEscrowV2: <code>{CONTRACT_CONFIG.P2P_ESCROW}</code>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Dados do Formulário:</strong>
        <br />
        Código de Barras: <code>{formData?.codigoBarras || 'N/A'}</code>
        <br />
        Valor USDT: <code>{formData?.valorUSDT || 'N/A'}</code>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Endereço Conectado:</strong>
        <br />
        <code>{userAddress || 'N/A'}</code>
      </div>

      <button
        onClick={handleTest}
        disabled={isCreatingEscrow || !userAddress || !formData?.valorUSDT}
        style={{
          padding: '12px 24px',
          backgroundColor: isCreatingEscrow ? '#94a3b8' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isCreatingEscrow ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isCreatingEscrow ? '🔄 Processando...' : '🎯 Testar Solução Final'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #f87171',
          borderRadius: '6px',
          color: '#dc2626'
        }}>
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          backgroundColor: result.error ? '#fef2f2' : '#f0fdf4', 
          border: `1px solid ${result.error ? '#f87171' : '#4ade80'}`,
          borderRadius: '6px',
          color: result.error ? '#dc2626' : '#166534'
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

      <div style={{ 
        marginTop: '15px', 
        padding: '12px', 
        backgroundColor: '#f1f5f9', 
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#475569'
      }}>
        <strong>🔧 Nova Versão Otimizada:</strong>
        <br />
        • Config fixa injetada (sem dependências externas)
        <br />
        • Decodificação automática de erros de revert
        <br />
        • Validação robusta de carteira e rede
        <br />
        • Gas estimation automático com margem de 20%
        <br />
        • Validação de saldo antes da transação
        <br />
        • Verificação de contratos deployados
        <br />
        • Receipt validation para confirmação
        <br />
        • Interface ERC20 completa inline
      </div>
    </div>
  );
};

export default FinalEscrowTest;
