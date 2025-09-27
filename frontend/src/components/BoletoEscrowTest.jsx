import React, { useState } from 'react';
import { useBoletoEscrowDirect } from '../hooks/useBoletoEscrowDirect';
import { CONTRACT_CONFIG } from '../contracts/config';

export function BoletoEscrowTest({ formData = null }) {
  const {
    connectWallet,
    createEscrow,
    isCreatingEscrow,
    isConnected,
    address
  } = useBoletoEscrowDirect();

  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dados dinâmicos do formulário ou valores padrão
  const testData = {
    valorReais: formData?.valor || 0,
    valorUsdt: formData?.valorUsdt || 0,
    boletoId: Date.now(),
    buyerAddress: address
  };

  const handleCreateEscrow = async () => {
    if (!isConnected || !address) {
      setTestResult({ error: 'Conecte sua carteira primeiro!' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 [TESTE] Iniciando teste de criação de escrow...');
      console.log('🧪 [TESTE] Dados do teste:', testData);

      const result = await createEscrow({
        boletoId: testData.boletoId,
        valorUsdt: testData.valorUsdt,
        valorReais: testData.valorReais,
        buyerAddress: testData.buyerAddress
      });

      console.log('✅ [TESTE] Escrow criado com sucesso:', result);
      setTestResult({ success: true, data: result });

    } catch (error) {
      console.error('❌ [TESTE] Erro ao criar escrow:', error);
      setTestResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFees = () => {
    const boletoAmount = testData.valorUsdt;
    
    // Taxa de transação do vendedor (2% sobre o valor do boleto)
    const transactionFeePercentage = 2; // 2%
    const transactionFee = boletoAmount * (transactionFeePercentage / 100);
    const totalTrapped = boletoAmount + transactionFee;

    // Taxa de serviço do comprador (R$ 5,00 para valores até R$ 100,00)
    let serviceFee;
    if (testData.valorReais <= 100) {
      serviceFee = 5; // R$ 5,00
    } else {
      // 4% para valores acima de R$ 100,00
      serviceFee = testData.valorReais * 0.04;
    }
    
    // Convertendo taxa de serviço para USDT (1 USD = 5.42 BRL)
    const serviceFeeUsdt = serviceFee / 5.42;
    const buyerReceives = boletoAmount - serviceFeeUsdt;

    return {
      boletoAmount,
      transactionFee,
      totalTrapped,
      serviceFee,
      serviceFeeUsdt,
      buyerReceives
    };
  };

  const fees = calculateFees();

  // Não mostrar se não há dados válidos
  if (!testData.valorReais || !testData.valorUsdt) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid #ffa500', 
        borderRadius: '10px', 
        margin: '20px 0',
        backgroundColor: '#fff8e1'
      }}>
        <h3>🧪 Teste de Escrow - Premissas do Projeto</h3>
        <p>⚠️ Preencha o formulário acima para testar o escrow com valores dinâmicos.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #4CAF50', 
      borderRadius: '10px', 
      margin: '20px 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🧪 Teste de Escrow - Premissas do Projeto</h3>
      <p><strong>Valores do Formulário:</strong> R$ {testData.valorReais} = {testData.valorUsdt} USDT</p>
      
      {!isConnected ? (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={connectWallet}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔗 Conectar Carteira
          </button>
        </div>
      ) : (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #4CAF50', 
          borderRadius: '5px' 
        }}>
          <h4>✅ Carteira Conectada</h4>
          <p><strong>Endereço:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}</p>
        </div>
      )}

      {isConnected && (
        <div style={{ marginTop: '20px' }}>
          <h4>📊 Simulação do Fluxo Completo</h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Vendedor */}
            <div style={{ 
              padding: '15px', 
              border: '1px solid #2196F3', 
              borderRadius: '5px',
              backgroundColor: '#e3f2fd'
            }}>
              <h5>🛒 VENDEDOR</h5>
              <p><strong>Boleto:</strong> R$ {testData.valorReais.toFixed(2)}</p>
              <p><strong>Valor USDT:</strong> {testData.valorUsdt} USDT</p>
              <p><strong>Taxa Transação (2%):</strong> {fees.transactionFee.toFixed(6)} USDT</p>
              <p><strong>Total Travado:</strong> {fees.totalTrapped.toFixed(6)} USDT</p>
              <p><strong>Valor Mínimo:</strong> 5.0 USDT ✅</p>
            </div>

            {/* Comprador */}
            <div style={{ 
              padding: '15px', 
              border: '1px solid #FF9800', 
              borderRadius: '5px',
              backgroundColor: '#fff3e0'
            }}>
              <h5>💰 COMPRADOR</h5>
              <p><strong>Paga:</strong> R$ {testData.valorReais.toFixed(2)}</p>
              <p><strong>Taxa Serviço:</strong> R$ {fees.serviceFee.toFixed(2)} {testData.valorReais <= 100 ? '(fixa)' : '(4%)'}</p>
              <p><strong>Taxa em USDT:</strong> {fees.serviceFeeUsdt.toFixed(6)} USDT</p>
              <p><strong>Recebe:</strong> {fees.buyerReceives.toFixed(6)} USDT</p>
            </div>

            {/* Aplicativo */}
            <div style={{ 
              padding: '15px', 
              border: '1px solid #4CAF50', 
              borderRadius: '5px',
              backgroundColor: '#e8f5e8'
            }}>
              <h5>🏛️ APLICATIVO</h5>
              <p><strong>Carteira:</strong> Contrato Escrow</p>
              <p><strong>Taxa Serviço:</strong> {fees.serviceFeeUsdt.toFixed(6)} USDT</p>
              <p><strong>Taxa Transação:</strong> 2% (vendedor)</p>
              <p><strong>Total Máximo:</strong> {(fees.serviceFeeUsdt + fees.transactionFee).toFixed(6)} USDT</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>⏰ Temporizadores do Sistema</h4>
            <ul>
              <li><strong>2 horas:</strong> Vendedor recebe 100% da taxa de volta</li>
              <li><strong>24 horas:</strong> Vendedor recebe 50% da taxa de volta</li>
              <li><strong>48 horas:</strong> Vendedor recebe 25% da taxa de volta</li>
              <li><strong>72 horas:</strong> Baixa automática, aplicativo fica com 100% da taxa</li>
            </ul>
          </div>

          <button
            onClick={handleCreateEscrow}
            disabled={isLoading || isCreatingEscrow}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: isLoading || isCreatingEscrow ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading || isCreatingEscrow ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {isLoading || isCreatingEscrow ? '⏳ Processando...' : '🔒 Criar Escrow (Travar USDT)'}
          </button>

          {testResult && (
            <div style={{
              padding: '15px',
              borderRadius: '5px',
              backgroundColor: testResult.error ? '#ffebee' : '#e8f5e8',
              border: `1px solid ${testResult.error ? '#f44336' : '#4CAF50'}`
            }}>
              <h4>{testResult.error ? '❌ Erro' : '✅ Sucesso'}</h4>
              {testResult.error ? (
                <p>{testResult.error}</p>
              ) : (
                <div>
                  <p><strong>Hash da Transação:</strong> {testResult.data.txHash}</p>
                  <p><strong>Escrow ID:</strong> {testResult.data.escrowId}</p>
                  <p><strong>Valor do Boleto:</strong> {testResult.data.boletoAmount} USDT</p>
                  <p><strong>Taxa de Transação:</strong> {testResult.data.transactionFee} USDT</p>
                  <p><strong>Total Travado:</strong> {testResult.data.totalTrapped} USDT</p>
                </div>
              )}
            </div>
          )}

          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#fff3e0',
            borderRadius: '5px'
          }}>
            <h5>ℹ️ Informações do Teste</h5>
            <p><strong>Boleto ID:</strong> {testData.boletoId}</p>
            <p><strong>Comprador:</strong> {testData.buyerAddress}</p>
            <p><strong>Rede:</strong> {CONTRACT_CONFIG.NETWORK.name}</p>
            <p><strong>Contrato Escrow:</strong> {CONTRACT_CONFIG.P2P_ESCROW}</p>
          </div>
        </div>
      )}
    </div>
  );
}
