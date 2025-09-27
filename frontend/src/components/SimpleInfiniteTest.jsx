import React, { useState } from 'react';
import { ethers } from 'ethers';

const SimpleInfiniteTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2P_ESCROW: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Testando aprovação infinita simples...');
    
    try {
      // 1. Conectar ao MetaMask
      console.log('1. Conectando ao MetaMask...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('✅ Conectado:', address);

      // 2. Criar contrato USDT
      const usdt = new ethers.Contract(CONFIG.MOCK_USDT, [
        'function approve(address spender, uint256 value) returns (bool)',
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ], signer);

      // 3. Verificar saldo
      const decimals = await usdt.decimals();
      const balance = await usdt.balanceOf(address);
      console.log('✅ Saldo:', ethers.formatUnits(balance, decimals), 'USDT');

      // 4. Verificar allowance atual
      const currentAllowance = await usdt.allowance(address, CONFIG.P2P_ESCROW);
      console.log('🔐 Allowance atual:', ethers.formatUnits(currentAllowance, decimals), 'USDT');

      // 5. Aprovação infinita
      console.log('5. Aprovando com valor infinito...');
      const maxUint256 = ethers.MaxUint256;
      
      const approveTx = await usdt.approve(CONFIG.P2P_ESCROW, maxUint256, {
        gasLimit: 100000
      });
      
      console.log('✅ Aprovação infinita enviada:', approveTx.hash);
      
      const approveReceipt = await approveTx.wait();
      console.log('✅ Aprovação infinita confirmada');
      
      // 6. Verificar nova allowance
      const newAllowance = await usdt.allowance(address, CONFIG.P2P_ESCROW);
      console.log('🔐 Nova allowance:', ethers.formatUnits(newAllowance, decimals), 'USDT');

      // 7. Testar criação de escrow
      console.log('7. Testando criação de escrow...');
      const escrow = new ethers.Contract(CONFIG.P2P_ESCROW, [
        'function createEscrow(uint256 boletoId, uint256 amount, address buyer) external returns (bytes32)'
      ], signer);

      const baseAmount = ethers.parseUnits('122.07', decimals); // Valor do boleto
      const boletoId = BigInt(Date.now());
      
      const escrowTx = await escrow.createEscrow(boletoId, baseAmount, address, {
        gasLimit: 200000
      });
      
      console.log('✅ Escrow enviado:', escrowTx.hash);
      
      const escrowReceipt = await escrowTx.wait();
      console.log('✅ Escrow confirmado');
      
      // 8. Verificar saldo após transação
      const finalBalance = await usdt.balanceOf(address);
      const balanceDiff = balance - finalBalance;
      console.log('💰 Saldo após transação:', ethers.formatUnits(finalBalance, decimals), 'USDT');
      console.log('💸 Diferença:', ethers.formatUnits(balanceDiff, decimals), 'USDT');

      setTestResult(`✅ Aprovação infinita funcionou perfeitamente!
      
📊 Resultados:
• Conta: ${address}
• Saldo inicial: ${ethers.formatUnits(balance, decimals)} USDT
• Saldo final: ${ethers.formatUnits(finalBalance, decimals)} USDT
• Diferença: ${ethers.formatUnits(balanceDiff, decimals)} USDT
• Valor do boleto: ${ethers.formatUnits(baseAmount, decimals)} USDT
• Allowance inicial: ${ethers.formatUnits(currentAllowance, decimals)} USDT
• Allowance final: ${ethers.formatUnits(newAllowance, decimals)} USDT
• Escrow Hash: ${escrowTx.hash}

🎉 Aprovação infinita é a solução definitiva!
Use este método para todas as transações futuras.`);
      
    } catch (error) {
      console.error('❌ Erro no teste simples:', error);
      setTestResult(`❌ Erro no teste simples:
      
${error.message}

🔍 Aprovação infinita deveria funcionar.
Se ainda falhar, o problema pode ser na rede ou contrato.`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #00BCD4', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#e0f7fa'
    }}>
      <h3>♾️ Teste Simples - Aprovação Infinita</h3>
      <p>Este teste foca apenas na aprovação infinita, que é a solução mais confiável.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#00BCD4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isTesting ? '🔄 Testando...' : '♾️ Testar Aprovação Infinita'}
      </button>

      {testResult && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
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
        <h4>♾️ Por que este teste é melhor:</h4>
        <ul>
          <li>✅ Foca apenas na aprovação infinita</li>
          <li>✅ Evita testes desnecessários</li>
          <li>✅ Mais direto e confiável</li>
          <li>✅ Testa o fluxo completo</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleInfiniteTest;



