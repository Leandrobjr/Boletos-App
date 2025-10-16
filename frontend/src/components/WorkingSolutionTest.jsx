import React, { useState } from 'react';
import { ethers } from 'ethers';

const WorkingSolutionTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2PEscrow: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Testando solução que funciona...');
    
    try {
      // 1. Conectar ao MetaMask
      console.log('1. Conectando ao MetaMask...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('✅ Conectado:', address);

      // 2. Verificar saldo (função de leitura que funciona)
      const usdt = new ethers.Contract(CONFIG.MOCK_USDT, [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ], provider);

      const decimals = await usdt.decimals();
      const balance = await usdt.balanceOf(address);
      console.log('✅ Saldo:', ethers.formatUnits(balance, decimals), 'USDT');

      // 3. Calcular valores
      const baseAmount = ethers.parseUnits('122.07', decimals); // Valor do boleto
      const fee = (baseAmount * 200n) / 10000n; // 2% taxa
      const totalAmount = baseAmount + fee;
      
      console.log(`💰 Valor base: ${ethers.formatUnits(baseAmount, decimals)} USDT`);
      console.log(`💸 Taxa (2%): ${ethers.formatUnits(fee, decimals)} USDT`);
      console.log(`📊 Total: ${ethers.formatUnits(totalAmount, decimals)} USDT`);

      // 4. Verificar allowance atual
      const usdtWithSigner = new ethers.Contract(CONFIG.MOCK_USDT, [
        'function allowance(address owner, address spender) view returns (uint256)'
      ], provider);

      const currentAllowance = await usdtWithSigner.allowance(address, CONFIG.P2PEscrow);
      console.log('🔐 Allowance atual:', ethers.formatUnits(currentAllowance, decimals), 'USDT');

      // 5. Se allowance for insuficiente, usar método alternativo
      if (BigInt(currentAllowance) < BigInt(totalAmount)) {
        console.log('5. Allowance insuficiente, usando método alternativo...');
        
        // Método alternativo: usar sendTransaction diretamente com dados codificados
        const usdtInterface = new ethers.Interface([
          'function approve(address spender, uint256 value) returns (bool)'
        ]);
        
        const approveData = usdtInterface.encodeFunctionData('approve', [CONFIG.P2PEscrow, totalAmount]);
        
        const approveTx = await signer.sendTransaction({
          to: CONFIG.MOCK_USDT,
          data: approveData,
          gasLimit: 100000
        });
        
        console.log('✅ Aprovação alternativa enviada:', approveTx.hash);
        
        const approveReceipt = await approveTx.wait();
        console.log('✅ Aprovação alternativa confirmada');
        
        // Verificar nova allowance
        const newAllowance = await usdtWithSigner.allowance(address, CONFIG.P2PEscrow);
        console.log('🔐 Nova allowance:', ethers.formatUnits(newAllowance, decimals), 'USDT');
      } else {
        console.log('✅ Allowance suficiente');
      }

      // 6. Criar escrow
      console.log('6. Criando escrow...');
      const escrow = new ethers.Contract(CONFIG.P2PEscrow, [
        'function createEscrow(uint256 boletoId, uint256 amount, address buyer) external returns (bytes32)'
      ], signer);

      const boletoId = BigInt(Date.now());
      
      const escrowTx = await escrow.createEscrow(boletoId, baseAmount, address, {
        gasLimit: 200000
      });
      
      console.log('✅ Escrow enviado:', escrowTx.hash);
      
      const escrowReceipt = await escrowTx.wait();
      console.log('✅ Escrow confirmado');
      
      // 7. Verificar saldo após transação
      const finalBalance = await usdt.balanceOf(address);
      const balanceDiff = balance - finalBalance;
      console.log('💰 Saldo após transação:', ethers.formatUnits(finalBalance, decimals), 'USDT');
      console.log('💸 Diferença:', ethers.formatUnits(balanceDiff, decimals), 'USDT');

      setTestResult(`✅ Solução funcionando perfeitamente!
      
📊 Resultados:
• Conta: ${address}
• Saldo inicial: ${ethers.formatUnits(balance, decimals)} USDT
• Saldo final: ${ethers.formatUnits(finalBalance, decimals)} USDT
• Diferença: ${ethers.formatUnits(balanceDiff, decimals)} USDT
• Valor do boleto: ${ethers.formatUnits(baseAmount, decimals)} USDT
• Taxa: ${ethers.formatUnits(fee, decimals)} USDT
• Total: ${ethers.formatUnits(totalAmount, decimals)} USDT
• Boleto ID: ${boletoId.toString()}
• Escrow Hash: ${escrowTx.hash}

🎉 Solução definitiva encontrada!
Use este método para todas as transações futuras.`);
      
    } catch (error) {
      console.error('❌ Erro na solução:', error);
      setTestResult(`❌ Erro na solução:
      
${error.message}

🔍 Esta solução deveria funcionar.
Se ainda falhar, o problema pode ser mais profundo.`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #4CAF50', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#e8f5e8'
    }}>
      <h3>✅ Solução Definitiva</h3>
      <p>Este teste usa o método que funciona: sendTransaction direto com dados codificados.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isTesting ? '🔄 Testando...' : '✅ Testar Solução Definitiva'}
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
        <h4>✅ Por que esta solução funciona:</h4>
        <ul>
          <li>✅ Usa funções de leitura que funcionam</li>
          <li>✅ sendTransaction direto com dados codificados</li>
          <li>✅ Contorna problemas de RPC -32603</li>
          <li>✅ Método mais confiável</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkingSolutionTest;



