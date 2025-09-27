import React, { useState } from 'react';
import { ethers } from 'ethers';

const SimpleConnectivityTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2P_ESCROW: '0x695d8e05BA083A80e677A075438A48B0A0365B6a',
    NETWORK: {
      id: 80002,
      name: 'Polygon Amoy',
      rpcUrl: 'https://rpc-amoy.polygon.technology',
      alternativeRpcs: ['https://rpc-amoy.polygon.technology']
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Iniciando teste de conectividade...');
    
    try {
      // 1. Testar conexão com a rede
      console.log('1. Testando conexão com a rede...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('✅ Rede conectada:', network.name, network.chainId);
      
      // 2. Testar conta do usuário
      console.log('2. Testando conta do usuário...');
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('✅ Conta conectada:', address);
      
      // 3. Testar contrato MockUSDT (apenas leitura)
      console.log('3. Testando contrato MockUSDT...');
      const usdt = new ethers.Contract(CONFIG.MOCK_USDT, [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address owner) view returns (uint256)'
      ], provider);
      
      const name = await usdt.name();
      const symbol = await usdt.symbol();
      const decimals = await usdt.decimals();
      const totalSupply = await usdt.totalSupply();
      const balance = await usdt.balanceOf(address);
      
      console.log('✅ MockUSDT:', { name, symbol, decimals, totalSupply: ethers.formatUnits(totalSupply, decimals) });
      console.log('✅ Saldo do usuário:', ethers.formatUnits(balance, decimals), 'USDT');
      
      // 4. Testar contrato P2PEscrow (apenas leitura)
      console.log('4. Testando contrato P2PEscrow...');
      const escrow = new ethers.Contract(CONFIG.P2P_ESCROW, [
        'function owner() view returns (address)',
        'function paused() view returns (bool)'
      ], provider);
      
      const owner = await escrow.owner();
      const isPaused = await escrow.paused();
      
      console.log('✅ P2PEscrow:', { owner, isPaused });
      
      // 5. Verificar se tem saldo suficiente
      const testAmount = ethers.parseUnits('124.51', decimals); // 122.07 + 2%
      const hasEnoughBalance = balance >= testAmount;
      
      setTestResult(`✅ Teste de conectividade concluído com sucesso!
      
📊 Resultados:
• Rede: ${network.name} (${network.chainId})
• Conta: ${address}
• MockUSDT: ${name} (${symbol})
• Saldo: ${ethers.formatUnits(balance, decimals)} USDT
• P2PEscrow: Owner ${owner}, Pausado: ${isPaused}
• Saldo suficiente para teste: ${hasEnoughBalance ? 'SIM' : 'NÃO'}

${hasEnoughBalance ? '🎉 Sistema pronto para transações!' : '⚠️ Saldo insuficiente para teste completo'}`);
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setTestResult(`❌ Erro no teste de conectividade:
      
${error.message}

🔍 Possíveis causas:
• Problema de conexão com a rede
• Contrato não encontrado
• MetaMask não conectado
• Rede incorreta`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #2196F3', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f3f9ff'
    }}>
      <h3>🔍 Teste de Conectividade Simples</h3>
      <p>Este teste verifica apenas a conectividade básica sem fazer transações.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isTesting ? '🔄 Testando...' : '🔍 Testar Conectividade'}
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
        <h4>🔧 O que este teste verifica:</h4>
        <ul>
          <li>✅ Conexão com a rede Polygon Amoy</li>
          <li>✅ Conta MetaMask conectada</li>
          <li>✅ Contratos MockUSDT e P2PEscrow acessíveis</li>
          <li>✅ Saldo do usuário</li>
          <li>✅ Estado dos contratos</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleConnectivityTest;


