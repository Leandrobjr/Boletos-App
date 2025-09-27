import React, { useState } from 'react';
import { ethers } from 'ethers';

const DirectMethodTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2P_ESCROW: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Testando método direto...');
    
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

      // 6. Aprovar usando método direto
      if (BigInt(currentAllowance) < BigInt(totalAmount)) {
        console.log('6. Aprovando usando método direto...');
        
        // Usar sendTransaction diretamente
        const approveData = usdt.interface.encodeFunctionData('approve', [CONFIG.P2P_ESCROW, totalAmount]);
        
        const approveTx = await signer.sendTransaction({
          to: CONFIG.MOCK_USDT,
          data: approveData,
          gasLimit: 100000
        });
        
        console.log('✅ Aprovação direta enviada:', approveTx.hash);
        
        const approveReceipt = await approveTx.wait();
        console.log('✅ Aprovação direta confirmada');
        
        // Verificar nova allowance
        const newAllowance = await usdt.allowance(address, CONFIG.P2P_ESCROW);
        console.log('🔐 Nova allowance:', ethers.formatUnits(newAllowance, decimals), 'USDT');
      } else {
        console.log('✅ Allowance suficiente');
      }

      // 7. Criar escrow usando método direto
      console.log('7. Criando escrow usando método direto...');
      const boletoId = BigInt(Date.now());
      
      const escrowData = escrow.interface.encodeFunctionData('createEscrow', [boletoId, baseAmount, address]);
      
      const escrowTx = await signer.sendTransaction({
        to: CONFIG.P2P_ESCROW,
        data: escrowData,
        gasLimit: 200000
      });
      
      console.log('✅ Escrow direto enviado:', escrowTx.hash);
      
      const escrowReceipt = await escrowTx.wait();
      console.log('✅ Escrow direto confirmado');
      
      // 8. Verificar saldo após transação
      const newBalance = await usdt.balanceOf(address);
      const balanceDiff = balance - newBalance;
      console.log('💰 Saldo após transação:', ethers.formatUnits(newBalance, decimals), 'USDT');
      console.log('💸 Diferença:', ethers.formatUnits(balanceDiff, decimals), 'USDT');

      setTestResult(`✅ Método direto funcionou perfeitamente!
      
📊 Resultados:
• Conta: ${address}
• Saldo inicial: ${ethers.formatUnits(balance, decimals)} USDT
• Saldo final: ${ethers.formatUnits(newBalance, decimals)} USDT
• Diferença: ${ethers.formatUnits(balanceDiff, decimals)} USDT
• Valor base: ${ethers.formatUnits(baseAmount, decimals)} USDT
• Taxa: ${ethers.formatUnits(fee, decimals)} USDT
• Total: ${ethers.formatUnits(totalAmount, decimals)} USDT
• Escrow Hash: ${escrowTx.hash}

🎉 O método direto contorna o problema de RPC!
Use este método para transações futuras.`);
      
    } catch (error) {
      console.error('❌ Erro no teste direto:', error);
      setTestResult(`❌ Erro no método direto:
      
${error.message}

🔍 Este método deveria contornar o problema de RPC.
Se ainda falhar, o problema pode ser mais profundo.`);
    } finally {
      setIsTesting(false);
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
      <h3>🎯 Método Direto - Contorna RPC</h3>
      <p>Este teste usa sendTransaction diretamente para contornar problemas de RPC -32603.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#E91E63',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isTesting ? '🔄 Testando...' : '🎯 Testar Método Direto'}
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
        <h4>🎯 Como funciona:</h4>
        <ul>
          <li>✅ Usa <code>sendTransaction</code> diretamente</li>
          <li>✅ Contorna problemas de RPC -32603</li>
          <li>✅ Gas fixo para evitar problemas</li>
          <li>✅ Método mais confiável</li>
        </ul>
      </div>
    </div>
  );
};

export default DirectMethodTest;


