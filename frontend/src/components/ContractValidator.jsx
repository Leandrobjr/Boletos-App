import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../contracts/config.js';

const ContractValidator = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateContracts = async () => {
    setIsValidating(true);
    setValidationResult('🔄 Validando contratos...');

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask não detectado');
      }

      // Conectar à carteira
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Criar provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Verificar rede
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(80002)) {
        throw new Error(`Rede incorreta. Esperado: 80002 (Polygon Amoy), Atual: ${network.chainId}`);
      }

      const results = [];

      // Validar MockUSDT
      try {
        const usdtCode = await provider.getCode(CONTRACT_CONFIG.MOCK_USDT);
        if (usdtCode === '0x') {
          results.push(`❌ MockUSDT: Contrato não encontrado em ${CONTRACT_CONFIG.MOCK_USDT}`);
        } else {
          // Testar se o contrato responde
          const usdt = new ethers.Contract(
            CONTRACT_CONFIG.MOCK_USDT,
            [
              "function symbol() view returns (string)",
              "function name() view returns (string)",
              "function decimals() view returns (uint8)",
              "function balanceOf(address account) view returns (uint256)"
            ],
            provider
          );
          
          const symbol = await usdt.symbol();
          const name = await usdt.name();
          const decimals = await usdt.decimals();
          
          results.push(`✅ MockUSDT: ${name} (${symbol}) - ${decimals} decimais`);
        }
      } catch (error) {
        results.push(`❌ MockUSDT: ${error.message}`);
      }

      // Validar P2PEscrow
      try {
        const escrowCode = await provider.getCode(CONTRACT_CONFIG.P2P_ESCROW);
        if (escrowCode === '0x') {
          results.push(`❌ P2PEscrow: Contrato não encontrado em ${CONTRACT_CONFIG.P2P_ESCROW}`);
        } else {
          results.push(`✅ P2PEscrow: Contrato encontrado em ${CONTRACT_CONFIG.P2P_ESCROW}`);
        }
      } catch (error) {
        results.push(`❌ P2PEscrow: ${error.message}`);
      }

      // Verificar saldo do usuário
      try {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const usdt = new ethers.Contract(
          CONTRACT_CONFIG.MOCK_USDT,
          ["function balanceOf(address account) view returns (uint256)"],
          provider
        );
        
        const balance = await usdt.balanceOf(address);
        const balanceFormatted = ethers.formatUnits(balance, 6);
        
        results.push(`💰 Saldo USDT: ${balanceFormatted} USDT`);
      } catch (error) {
        results.push(`❌ Erro ao verificar saldo: ${error.message}`);
      }

      setValidationResult(results.join('\n'));
    } catch (error) {
      setValidationResult(`❌ Erro geral: ${error.message}`);
    } finally {
      setIsValidating(false);
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
      <h3>🔍 Validador de Contratos</h3>
      <p>Este componente verifica se os contratos estão deployados corretamente na rede Polygon Amoy.</p>
      
      <button 
        onClick={validateContracts}
        disabled={isValidating}
        style={{
          padding: '10px 20px',
          backgroundColor: isValidating ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isValidating ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '15px'
        }}
      >
        {isValidating ? '🔄 Validando...' : '🔍 Validar Contratos'}
      </button>

      {validationResult && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px',
          whiteSpace: 'pre-line',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {validationResult}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <h4>📋 Endereços Configurados:</h4>
        <ul>
          <li><strong>MockUSDT:</strong> {CONTRACT_CONFIG.MOCK_USDT}</li>
          <li><strong>P2PEscrow:</strong> {CONTRACT_CONFIG.P2P_ESCROW}</li>
          <li><strong>Rede:</strong> Polygon Amoy (80002)</li>
        </ul>
      </div>
    </div>
  );
};

export default ContractValidator;

