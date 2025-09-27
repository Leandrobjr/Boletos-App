import React, { useState } from 'react';
import { ethers } from 'ethers';

const MockUSDTDiagnostic = () => {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2PEscrow: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('🔄 Diagnosticando contrato MockUSDT...');
    
    try {
      // 1. Conectar ao MetaMask
      console.log('1. Conectando ao MetaMask...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('✅ Conectado:', address);

      // 2. Verificar se o contrato MockUSDT existe
      console.log('2. Verificando se o contrato MockUSDT existe...');
      const code = await provider.getCode(CONFIG.MOCK_USDT);
      if (code === '0x') {
        throw new Error('Contrato MockUSDT não encontrado na rede');
      }
      console.log('✅ Contrato MockUSDT encontrado');
      console.log('📏 Tamanho do código:', code.length, 'caracteres');

      // 3. Testar funções básicas uma por uma
      console.log('3. Testando funções básicas...');
      
      const usdt = new ethers.Contract(CONFIG.MOCK_USDT, [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address owner) view returns (uint256)'
      ], provider);

      let results = {};
      
      // Testar name()
      try {
        results.name = await usdt.name();
        console.log('✅ name():', results.name);
      } catch (error) {
        console.error('❌ name() falhou:', error.message);
        results.name = `ERRO: ${error.message}`;
      }

      // Testar symbol()
      try {
        results.symbol = await usdt.symbol();
        console.log('✅ symbol():', results.symbol);
      } catch (error) {
        console.error('❌ symbol() falhou:', error.message);
        results.symbol = `ERRO: ${error.message}`;
      }

      // Testar decimals()
      try {
        results.decimals = await usdt.decimals();
        console.log('✅ decimals():', results.decimals);
      } catch (error) {
        console.error('❌ decimals() falhou:', error.message);
        results.decimals = `ERRO: ${error.message}`;
      }

      // Testar totalSupply()
      try {
        results.totalSupply = await usdt.totalSupply();
        console.log('✅ totalSupply():', results.totalSupply.toString());
      } catch (error) {
        console.error('❌ totalSupply() falhou:', error.message);
        results.totalSupply = `ERRO: ${error.message}`;
      }

      // Testar balanceOf()
      try {
        results.balance = await usdt.balanceOf(address);
        console.log('✅ balanceOf():', results.balance.toString());
      } catch (error) {
        console.error('❌ balanceOf() falhou:', error.message);
        results.balance = `ERRO: ${error.message}`;
      }

      // 4. Verificar se é um contrato ERC20 válido
      const isERC20Valid = results.name && results.symbol && results.decimals && results.totalSupply && results.balance;
      
      setTestResult(`🔍 Diagnóstico do MockUSDT:
      
📊 Resultados:
• Conta: ${address}
• Contrato existe: ✅ Sim (${code.length} caracteres)
• name(): ${results.name}
• symbol(): ${results.symbol}
• decimals(): ${results.decimals}
• totalSupply(): ${results.totalSupply}
• balanceOf(): ${results.balance}

🎯 Conclusão:
${isERC20Valid ? 
  '✅ Contrato MockUSDT está funcionando corretamente!' : 
  '❌ Contrato MockUSDT tem problemas de implementação!'}

💡 Recomendação:
${isERC20Valid ? 
  'O contrato está OK. O problema pode estar na rede ou MetaMask.' : 
  'O contrato MockUSDT precisa ser redeployado ou corrigido.'}`);
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
      setTestResult(`❌ Erro no diagnóstico:
      
${error.message}

🔍 Possíveis causas:
• Contrato não existe na rede
• Problema de conectividade
• MetaMask não configurado`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #FF9800', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#fff3e0'
    }}>
      <h3>🔍 Diagnóstico MockUSDT</h3>
      <p>Este teste verifica se o contrato MockUSDT está implementado corretamente.</p>
      
      <button 
        onClick={handleTest}
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isTesting ? '🔄 Diagnosticando...' : '🔍 Diagnosticar MockUSDT'}
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
        <h4>🔍 O que este teste verifica:</h4>
        <ul>
          <li>✅ Existência do contrato na rede</li>
          <li>✅ Função name()</li>
          <li>✅ Função symbol()</li>
          <li>✅ Função decimals()</li>
          <li>✅ Função totalSupply()</li>
          <li>✅ Função balanceOf()</li>
        </ul>
      </div>
    </div>
  );
};

export default MockUSDTDiagnostic;



