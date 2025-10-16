import React, { useState } from 'react';
import { ethers } from 'ethers';

const InfiniteApprovalTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2P_ESCROW: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Testando aprovação infinita...');
    
    try {
      // 1. Conectar ao MetaMask
      console.log('1. Conectando ao MetaMask...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('✅ Conectado:', address);

      // 2. Criar contratos
      const usdt = new ethers.Contract(CONFIG.MOCK_USDT, [
        'function approve(address spender, uint256 value) returns (bool)',
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ], signer);

      const escrow = new ethers.Contract(CONFIG.P2P_ESCROW, [
        'function createEscrow(uint256 boletoId, uint256 amount, address buyer) external returns (bytes32)'
      ], signer);

      // 3. Verificar saldo
      const decimals = await usdt.decimals();
      const balance = await usdt.balanceOf(address);
      console.log('✅ Saldo:', ethers.formatUnits(balance, decimals), 'USDT');

      // 4. Calcular valores
      const baseAmount = ethers.parseUnits('122.07', decimals); // Valor do boleto
      const fee = (baseAmount * 200n) / 10000n; // 2% taxa
      const totalAmount = baseAmount + fee;
      
      console.log(`💰 Valor base: ${ethers.formatUnits(baseAmount, decimals)} USDT`);
      console.log(`💸 Taxa (2%): ${ethers.formatUnits(fee, decimals)} USDT`);
      console.log(`📊 Total: ${ethers.formatUnits(totalAmount, decimals)} USDT`);

      // 5. Verificar allowance atual
      const currentAllowance = await usdt.allowance(address, CONFIG.P2P_ESCROW);
      console.log('🔐 Allowance atual:', ethers.formatUnits(currentAllowance, decimals), 'USDT');

      // 6. Aprovação infinita (padrão mais confiável)
      if (BigInt(currentAllowance) < BigInt(totalAmount)) {
        console.log('6. Aprovando com valor infinito...');
        
        // Usar valor máximo (2^256 - 1) para aprovação infinita
        const maxUint256 = ethers.MaxUint256;
        
        const approveTx = await usdt.approve(CONFIG.P2P_ESCROW, maxUint256, {
          gasLimit: 100000
        });
        
        console.log('✅ Aprovação infinita enviada:', approveTx.hash);
        
        const approveReceipt = await approveTx.wait();
        console.log('✅ Aprovação infinita confirmada');
        
        // Verificar nova allowance
        const newAllowance = await usdt.allowance(address, CONFIG.P2P_ESCROW);
        console.log('🔐 Nova allowance:', ethers.formatUnits(newAllowance, decimals), 'USDT');
      } else {
        console.log('✅ Allowance suficiente');
      }

      // 7. Criar escrow
      console.log('7. Criando escrow...');
      const boletoId = BigInt(Date.now());
      
      const escrowTx = await escrow.createEscrow(boletoId, baseAmount, address, {
        gasLimit: 200000
      });
      
      console.log('✅ Escrow enviado:', escrowTx.hash);
      
      const escrowReceipt = await escrowTx.wait();
      console.log('✅ Escrow confirmado');
      
      // 8. Verificar saldo após transação
      const newBalance = await usdt.balanceOf(address);
      const balanceDiff = balance - newBalance;
      console.log('💰 Saldo após transação:', ethers.formatUnits(newBalance, decimals), 'USDT');
      console.log('💸 Diferença:', ethers.formatUnits(balanceDiff, decimals), 'USDT');

      // 9. Resetar allowance para segurança (opcional)
      console.log('9. Resetando allowance para segurança...');
      try {
        const resetTx = await usdt.approve(CONFIG.P2P_ESCROW, 0, {
          gasLimit: 100000
        });
        await resetTx.wait();
        console.log('✅ Allowance resetada para 0');
      } catch (resetError) {
        console.warn('⚠️ Não foi possível resetar allowance:', resetError.message);
      }

      setTestResult(`✅ Aprovação infinita funcionou perfeitamente!
      
📊 Resultados:
• Conta: ${address}
• Saldo inicial: ${ethers.formatUnits(balance, decimals)} USDT
• Saldo final: ${ethers.formatUnits(newBalance, decimals)} USDT
• Diferença: ${ethers.formatUnits(balanceDiff, decimals)} USDT
• Valor base: ${ethers.formatUnits(baseAmount, decimals)} USDT
• Taxa: ${ethers.formatUnits(fee, decimals)} USDT
• Total: ${ethers.formatUnits(totalAmount, decimals)} USDT
• Escrow Hash: ${escrowTx.hash}

🎉 Aprovação infinita contorna problemas de RPC!
Este é o método mais confiável para transações.`);
      
    } catch (error) {
      console.error('❌ Erro no teste de aprovação infinita:', error);
      setTestResult(`❌ Erro na aprovação infinita:
      
${error.message}

🔍 Aprovação infinita deveria ser mais confiável.
Se ainda falhar, o problema pode ser na rede ou contrato.`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #673AB7', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#ede7f6'
    }}>
      <h3>♾️ Aprovação Infinita - Mais Confiável</h3>
      <p>Este teste usa aprovação infinita (valor máximo) que é mais confiável que valores específicos.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#673AB7',
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
        <h4>♾️ Por que aprovação infinita é melhor:</h4>
        <ul>
          <li>✅ Evita problemas de cálculo de valores</li>
          <li>✅ Mais confiável que valores específicos</li>
          <li>✅ Padrão usado por DEXs e protocolos</li>
          <li>✅ Pode ser resetada após uso</li>
        </ul>
      </div>
    </div>
  );
};

export default InfiniteApprovalTest;


