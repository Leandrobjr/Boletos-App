/**
 * TESTE UNIVERSAL - ARQUITETURA DEFINITIVA
 * Componente que usa a arquitetura Universal Transaction Manager
 */

import React, { useState, useEffect } from 'react';
import { useBoletoEscrowUniversal } from '../hooks/useBoletoEscrowUniversal';

const UniversalEscrowTest = ({ formData = {} }) => {
  const { 
    createEscrow, 
    initializeSystem, 
    checkSystemHealth, 
    resetSystem,
    isCreatingEscrow, 
    error, 
    step, 
    systemInfo 
  } = useBoletoEscrowUniversal();
  
  const [testResult, setTestResult] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  // Auto-inicializar sistema
  useEffect(() => {
    const autoInit = async () => {
      try {
        console.log('🚀 [UNIVERSAL-UI] Auto-inicializando...');
        await initializeSystem();
      } catch (error) {
        console.warn('⚠️ [UNIVERSAL-UI] Auto-init falhou:', error.message);
      }
    };
    
    autoInit();
  }, [initializeSystem]);

  const handleTest = async () => {
    try {
      setTestResult('🔄 Iniciando teste com arquitetura universal...');
      
      // Usar dados do formulário atual (sem fallback que causa problema)
      console.log('📝 [UNIVERSAL-UI] Dados do formulário completos:', formData);
      
      if (!formData?.valorUSDT && !formData?.valorUsdt) {
        throw new Error('Erro: valorUSDT não encontrado no formulário. Preencha o formulário acima primeiro.');
      }
      
      const valorUSDT = formData.valorUSDT || formData.valorUsdt;
      const codigoBarras = formData.codigoBarras || 'UNIVERSAL-' + Date.now();
      
      console.log('💰 [UNIVERSAL-UI] Valor USDT do formulário:', valorUSDT);
      console.log('📝 [UNIVERSAL-UI] Código de barras:', codigoBarras);
      
      const testData = {
        valorUSDT: Number(valorUSDT),
        codigoBarras: codigoBarras,
        descricao: `Boleto R$ ${valorUSDT} USDT`
      };

      console.log('🚀 [UNIVERSAL-UI] Iniciando teste universal...');
      const result = await createEscrow(testData);
      
      setTestResult(`✅ SUCESSO COM ARQUITETURA UNIVERSAL!

📊 RESULTADOS DEFINITIVOS:
• Wallet: ${result.wallet} (${result.adapter})
• Boleto ID: ${result.boletoId}
• Valor: ${result.amount} USDT
• Taxa (2%): ${result.fee} USDT
• Total: ${result.total} USDT
• Escrow ID: ${result.escrowId}
• Transfer Hash: ${result.transferHash}
• Escrow Hash: ${result.escrowHash}

🎉 ARQUITETURA UNIVERSAL FUNCIONOU PERFEITAMENTE!
Esta é a solução definitiva, profissional e escalável.`);
      
      console.log('✅ [UNIVERSAL-UI] Teste concluído com sucesso:', result);
    } catch (err) {
      setTestResult(`❌ Erro: ${err.message}

🔍 Diagnóstico:
• Wallet atual: ${systemInfo?.wallet?.name || 'Não inicializado'}
• Adapter: ${systemInfo?.adapter || 'N/A'}
• Sistema: ${systemInfo ? 'Inicializado' : 'Não inicializado'}

💡 Sugestões:
1. Verificar se a carteira está conectada
2. Verificar rede (Polygon Amoy)
3. Tentar resetar o sistema
4. Verificar saldo de USDT`);
      console.error('❌ [UNIVERSAL-UI] Teste falhou:', err);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const health = await checkSystemHealth();
      setHealthStatus(health);
    } catch (error) {
      setHealthStatus({ status: 'ERROR', message: error.message });
    }
  };

  const handleReset = async () => {
    try {
      await resetSystem();
      setTestResult('🔄 Sistema resetado com sucesso');
      setHealthStatus(null);
    } catch (error) {
      setTestResult(`❌ Erro no reset: ${error.message}`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '3px solid #4CAF50', 
      borderRadius: '12px', 
      margin: '20px',
      backgroundColor: '#e8f5e8',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>
        🚀 ARQUITETURA UNIVERSAL - SOLUÇÃO DEFINITIVA
      </h2>
      <p style={{ marginBottom: '20px', color: '#1b5e20' }}>
        Esta é a implementação definitiva usando Universal Transaction Manager com suporte automático para Rabby e MetaMask.
      </p>
      
      {/* Informações do Sistema */}
      {systemInfo && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#c8e6c9',
          borderRadius: '6px',
          border: '1px solid #4CAF50'
        }}>
          <strong>🎯 Sistema Atual:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li><strong>Wallet:</strong> {systemInfo.wallet?.name} (Prioridade: {systemInfo.wallet?.priority})</li>
            <li><strong>Tipo:</strong> {systemInfo.wallet?.type}</li>
            <li><strong>Endereço:</strong> {systemInfo.connection?.address}</li>
          </ul>
        </div>
      )}

      {/* Informações do Formulário */}
      <div style={{ 
        marginBottom: '15px', 
        padding: '10px', 
        backgroundColor: '#e3f2fd',
        borderRadius: '6px',
        border: '1px solid #2196F3'
      }}>
        <strong>📝 Dados do Formulário:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '14px' }}>
          <li><strong>Valor USDT:</strong> {formData?.valorUSDT || formData?.valorUsdt || '❌ NÃO ENCONTRADO'}</li>
          <li><strong>Código Barras:</strong> {formData?.codigoBarras || '❌ NÃO ENCONTRADO'}</li>
          <li><strong>Valor R$:</strong> {formData?.valor || 'N/A'}</li>
          <li><strong>CPF/CNPJ:</strong> {formData?.cpfCnpj || 'N/A'}</li>
        </ul>
        {(!formData?.valorUSDT && !formData?.valorUsdt) && (
          <p style={{ color: '#d32f2f', fontSize: '12px', marginTop: '5px' }}>
            ⚠️ <strong>ATENÇÃO:</strong> Preencha o formulário acima primeiro para obter o valor correto!
          </p>
        )}
      </div>

      {/* Debug: Dados do Formulário */}
      {formData && Object.keys(formData).length > 0 && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#fff3e0',
          borderRadius: '6px',
          border: '1px solid #FF9800',
          fontSize: '12px'
        }}>
          <strong>📝 Dados do Formulário (Debug):</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li><strong>Valor R$:</strong> {formData.valor || 'N/A'}</li>
            <li><strong>Valor USDT:</strong> {formData.valorUSDT || formData.valorUsdt || 'N/A'}</li>
            <li><strong>Código Barras:</strong> {formData.codigoBarras || 'N/A'}</li>
            <li><strong>Valor a ser usado:</strong> {formData?.valorUSDT || formData?.valorUsdt || 'Fallback: 122.07'}</li>
          </ul>
        </div>
      )}

      {/* Controles */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleTest}
          disabled={isCreatingEscrow}
          style={{
            padding: '12px 24px',
            backgroundColor: isCreatingEscrow ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isCreatingEscrow ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isCreatingEscrow ? `🔄 ${step}...` : '🚀 TESTAR ARQUITETURA UNIVERSAL'}
        </button>

        <button 
          onClick={handleHealthCheck}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🩺 Health Check
        </button>

        <button 
          onClick={handleReset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Reset Sistema
        </button>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: healthStatus.status === 'HEALTHY' ? '#c8e6c9' : '#ffcdd2',
          border: `1px solid ${healthStatus.status === 'HEALTHY' ? '#4CAF50' : '#f44336'}`,
          borderRadius: '6px'
        }}>
          <strong>🩺 Health Check:</strong>
          <pre style={{ margin: '5px 0', fontSize: '12px' }}>
            {JSON.stringify(healthStatus, null, 2)}
          </pre>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '6px',
          color: '#d32f2f'
        }}>
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {/* Resultado */}
      {testResult && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: testResult.includes('✅') ? '#e8f5e8' : '#ffebee',
          border: `2px solid ${testResult.includes('✅') ? '#4CAF50' : '#f44336'}`,
          borderRadius: '8px',
          color: testResult.includes('✅') ? '#2e7d32' : '#d32f2f',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <strong>📋 RESULTADO:</strong>
          {testResult}
        </div>
      )}

      {/* Documentação da Arquitetura */}
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#1b5e20' }}>
        <h4>🏗️ ARQUITETURA IMPLEMENTADA:</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>✅ <strong>WalletRouter:</strong> Detecção automática do melhor wallet</li>
          <li>✅ <strong>WalletAdapters:</strong> Implementações específicas (Rabby, MetaMask, Generic)</li>
          <li>✅ <strong>UniversalTransactionManager:</strong> Coordenação central com fallbacks</li>
          <li>✅ <strong>Retry Logic:</strong> Tentativas automáticas com backoff exponencial</li>
          <li>✅ <strong>Wallet Switching:</strong> Mudança automática quando um wallet falha</li>
          <li>✅ <strong>Health Monitoring:</strong> Diagnóstico contínuo do sistema</li>
        </ul>
        
        <h4 style={{ marginTop: '15px' }}>🎯 VANTAGENS:</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>🔄 <strong>Fallback Automático:</strong> Se MetaMask falha, muda para Rabby</li>
          <li>🎯 <strong>Estratégias Múltiplas:</strong> Cada wallet tem implementações específicas</li>
          <li>📊 <strong>Monitoramento:</strong> Health checks e diagnósticos detalhados</li>
          <li>🔧 <strong>Escalável:</strong> Fácil adicionar novos wallets e estratégias</li>
          <li>💼 <strong>Corporativo:</strong> Padrões de design enterprise</li>
        </ul>
      </div>
    </div>
  );
};

export default UniversalEscrowTest;
