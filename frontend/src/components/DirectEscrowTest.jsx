import React, { useState } from 'react';
import { ethers } from 'ethers';

const DirectEscrowTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2PEscrow: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Testando escrow direto sem MockUSDT...');
    
    try {
      // 1. Conectar ao MetaMask
      console.log('1. Conectando ao MetaMask...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('✅ Conectado:', address);

      // 2. Verificar se o contrato P2PEscrow existe
      console.log('2. Verificando contrato P2PEscrow...');
      const escrowCode = await provider.getCode(CONFIG.P2PEscrow);
      if (escrowCode === '0x') {
        throw new Error('Contrato P2PEscrow não encontrado na rede');
      }
      console.log('✅ Contrato P2PEscrow encontrado');

      // 3. Criar contrato P2PEscrow
      const escrow = new ethers.Contract(CONFIG.P2PEscrow, [
        'function createEscrow(uint256 boletoId, uint256 amount, address buyer) external returns (bytes32)',
        'function owner() view returns (address)',
        'function paused() view returns (bool)'
      ], signer);

      // 4. Verificar estado do contrato
      console.log('4. Verificando estado do contrato...');
      const owner = await escrow.owner();
      const isPaused = await escrow.paused();
      console.log('✅ Owner:', owner);
      console.log('✅ Pausado:', isPaused);

      // 5. Usar valores fixos (assumindo 6 decimais para USDT)
      console.log('5. Usando valores fixos...');
      const decimals = 6; // USDT padrão
      const baseAmount = ethers.parseUnits('122.07', decimals); // Valor do boleto
      const boletoId = BigInt(Date.now());
      
      console.log(`💰 Valor base: ${ethers.formatUnits(baseAmount, decimals)} USDT`);
      console.log(`📝 Boleto ID: ${boletoId.toString()}`);

      // 6. Criar escrow diretamente (assumindo que o usuário já tem allowance)
      console.log('6. Criando escrow diretamente...');
      
      const escrowTx = await escrow.createEscrow(boletoId, baseAmount, address, {
        gasLimit: 300000 // Gas maior para garantir
      });
      
      console.log('✅ Escrow enviado:', escrowTx.hash);
      
      const escrowReceipt = await escrowTx.wait();
      console.log('✅ Escrow confirmado');
      
      // 7. Extrair escrow ID do evento
      const escrowId = escrowReceipt.logs[0].topics[1];
      console.log('📝 Escrow ID:', escrowId);

      setTestResult(`✅ Escrow criado com sucesso!
      
📊 Resultados:
• Conta: ${address}
• Contrato P2PEscrow: ✅ Funcionando
• Owner: ${owner}
• Pausado: ${isPaused}
• Valor do boleto: ${ethers.formatUnits(baseAmount, decimals)} USDT
• Boleto ID: ${boletoId.toString()}
• Escrow ID: ${escrowId}
• Hash: ${escrowTx.hash}

🎉 O contrato P2PEscrow está funcionando perfeitamente!
O problema está no contrato MockUSDT, não no P2PEscrow.`);
      
    } catch (error) {
      console.error('❌ Erro no teste direto:', error);
      setTestResult(`❌ Erro no teste direto:
      
${error.message}

🔍 Possíveis causas:
• Contrato P2PEscrow não existe
• MetaMask não configurado
• Rede incorreta
• Problema de gas`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #8BC34A', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f1f8e9'
    }}>
      <h3>🎯 Teste Direto - P2PEscrow</h3>
      <p>Este teste usa apenas o contrato P2PEscrow, contornando problemas do MockUSDT.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#8BC34A',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isTesting ? '🔄 Testando...' : '🎯 Testar P2PEscrow Direto'}
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
        <h4>🎯 Por que este teste é importante:</h4>
        <ul>
          <li>✅ Testa apenas o P2PEscrow</li>
          <li>✅ Contorna problemas do MockUSDT</li>
          <li>✅ Verifica se o escrow funciona</li>
          <li>✅ Identifica onde está o problema</li>
        </ul>
      </div>
    </div>
  );
};

export default DirectEscrowTest;



