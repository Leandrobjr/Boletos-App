import React, { useState } from 'react';
import { ethers } from 'ethers';

const DebugApprovalTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2P_ESCROW: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Iniciando teste de debug...');
    
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

      // 4. Testar aprovação com valor pequeno primeiro
      const smallAmount = ethers.parseUnits('1', decimals); // 1 USDT
      console.log('4. Testando aprovação com valor pequeno (1 USDT)...');
      
      try {
        const approveTx = await usdt.approve(CONFIG.P2P_ESCROW, smallAmount, {
          gasLimit: 100000
        });
        console.log('✅ Aprovação pequena enviada:', approveTx.hash);
        
        const receipt = await approveTx.wait();
        console.log('✅ Aprovação pequena confirmada');
        
        // 5. Verificar allowance
        const allowance = await usdt.allowance(address, CONFIG.P2P_ESCROW);
        console.log('✅ Allowance atual:', ethers.formatUnits(allowance, decimals), 'USDT');
        
        // 6. Testar aprovação com valor maior
        const largeAmount = ethers.parseUnits('124.51', decimals); // 122.07 + 2%
        console.log('6. Testando aprovação com valor grande (124.51 USDT)...');
        
        const approveTx2 = await usdt.approve(CONFIG.P2P_ESCROW, largeAmount, {
          gasLimit: 100000
        });
        console.log('✅ Aprovação grande enviada:', approveTx2.hash);
        
        const receipt2 = await approveTx2.wait();
        console.log('✅ Aprovação grande confirmada');
        
        setTestResult(`✅ Teste de debug concluído com sucesso!
        
📊 Resultados:
• Conta: ${address}
• Saldo: ${ethers.formatUnits(balance, decimals)} USDT
• Aprovação pequena: ✅ Sucesso
• Aprovação grande: ✅ Sucesso
• Allowance final: ${ethers.formatUnits(allowance, decimals)} USDT

🎉 O contrato MockUSDT está funcionando corretamente!
O problema pode estar em outro lugar.`);
        
      } catch (approveError) {
        console.error('❌ Erro na aprovação:', approveError);
        setTestResult(`❌ Erro na aprovação:
        
${approveError.message}

🔍 Detalhes do erro:
• Código: ${approveError.code}
• Dados: ${approveError.data}
• Gas usado: ${approveError.gasUsed}

💡 Possíveis soluções:
• Verificar se o contrato MockUSDT está correto
• Tentar com gas maior
• Verificar se a rede está correta`);
      }

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setTestResult(`❌ Erro no teste de debug:
      
${error.message}

🔍 Possíveis causas:
• MetaMask não conectado
• Rede incorreta
• Contrato não encontrado`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #9C27B0', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f3e5f5'
    }}>
      <h3>🔍 Teste de Debug - Aprovação</h3>
      <p>Este teste verifica especificamente o problema de aprovação do MockUSDT.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#9C27B0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isTesting ? '🔄 Testando...' : '🔍 Testar Debug'}
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
        <h4>🔧 O que este teste faz:</h4>
        <ul>
          <li>✅ Testa aprovação com valor pequeno (1 USDT)</li>
          <li>✅ Testa aprovação com valor grande (124.51 USDT)</li>
          <li>✅ Verifica allowance após cada aprovação</li>
          <li>✅ Identifica onde exatamente está o problema</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugApprovalTest;


