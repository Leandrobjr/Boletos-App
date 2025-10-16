import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../contracts/config.js';

const SimpleContractTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const testContract = async () => {
    setIsTesting(true);
    setTestResult('🔄 Testando contrato...');

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask não detectado');
      }

      // Conectar à carteira
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log('🧪 Testando contrato MockUSDT...');
      console.log('Endereço:', address);
      console.log('Contrato:', CONTRACT_CONFIG.MOCK_USDT);

      // Criar contrato
      const mockUSDT = new ethers.Contract(
        CONTRACT_CONFIG.MOCK_USDT,
        [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
          "function totalSupply() view returns (uint256)",
          "function balanceOf(address account) view returns (uint256)"
        ],
        signer
      );

      // Testar funções
      const name = await mockUSDT.name();
      console.log('✅ Nome:', name);

      const symbol = await mockUSDT.symbol();
      console.log('✅ Símbolo:', symbol);

      const decimals = await mockUSDT.decimals();
      console.log('✅ Decimais:', decimals.toString());

      const totalSupply = await mockUSDT.totalSupply();
      console.log('✅ Total Supply:', ethers.formatUnits(totalSupply, decimals), symbol);

      const balance = await mockUSDT.balanceOf(address);
      console.log('✅ Seu saldo:', ethers.formatUnits(balance, decimals), symbol);

      setTestResult(`✅ Sucesso! Contrato funcionando:
Nome: ${name}
Símbolo: ${symbol}
Decimais: ${decimals}
Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}
Seu saldo: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setTestResult(`❌ Erro: ${error.message}`);
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
      <h3>🧪 Teste Simples do Contrato</h3>
      <p>Este teste verifica se o contrato MockUSDT responde corretamente.</p>
      
      <button 
        onClick={testContract}
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
        {isTesting ? '🔄 Testando...' : '🧪 Testar Contrato'}
      </button>

      {testResult && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: testResult.includes('✅') ? '#e8f5e8' : '#ffebee',
          border: `1px solid ${testResult.includes('✅') ? '#4CAF50' : '#f44336'}`,
          borderRadius: '4px',
          color: testResult.includes('✅') ? '#2e7d32' : '#d32f2f',
          whiteSpace: 'pre-line'
        }}>
          <strong>Resultado:</strong><br/>{testResult}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <h4>📋 Informações do Contrato:</h4>
        <ul>
          <li><strong>Endereço:</strong> {CONTRACT_CONFIG.MOCK_USDT}</li>
          <li><strong>Rede:</strong> Polygon Amoy (80002)</li>
          <li><strong>RPC:</strong> {CONTRACT_CONFIG.NETWORK.rpcUrl}</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleContractTest;