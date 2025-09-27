import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../contracts/config.js';

const NetworkFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState(null);

  const fixNetwork = async () => {
    setIsFixing(true);
    setResult('🔄 Corrigindo rede...');

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask não detectado');
      }

      // 1. Forçar reconexão da carteira
      console.log('🔄 Forçando reconexão da carteira...');
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // 2. Verificar e trocar para a rede correta
      const chainId = `0x${CONTRACT_CONFIG.NETWORK.id.toString(16)}`;
      console.log('🔄 Verificando rede:', chainId);

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        });
        console.log('✅ Rede trocada com sucesso');
      } catch (switchError) {
        if (switchError.code === 4902) {
          // Adicionar rede se não existir
          console.log('🔄 Adicionando rede Polygon Amoy...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainId,
              chainName: CONTRACT_CONFIG.NETWORK.name,
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: CONTRACT_CONFIG.NETWORK.alternativeRpcs,
              blockExplorerUrls: [CONTRACT_CONFIG.NETWORK.blockExplorer],
            }],
          });
          console.log('✅ Rede adicionada com sucesso');
        } else {
          throw switchError;
        }
      }

      // 3. Aguardar sincronização
      console.log('🔄 Aguardando sincronização...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. Testar contrato com provider direto
      console.log('🔄 Testando contrato...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Criar contrato com interface mais simples
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

      // Testar com retry
      let name, symbol, decimals, totalSupply, balance;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Tentativa ${attempt}/3...`);
          
          name = await mockUSDT.name();
          symbol = await mockUSDT.symbol();
          decimals = await mockUSDT.decimals();
          totalSupply = await mockUSDT.totalSupply();
          balance = await mockUSDT.balanceOf(address);
          
          console.log('✅ Contrato funcionando!');
          break;
        } catch (error) {
          console.warn(`⚠️ Tentativa ${attempt} falhou:`, error.message);
          if (attempt === 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setResult(`✅ Rede corrigida com sucesso!
Nome: ${name}
Símbolo: ${symbol}
Decimais: ${decimals}
Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}
Seu saldo: ${ethers.formatUnits(balance, decimals)} ${symbol}

Agora você pode testar as transações normalmente.`);

    } catch (error) {
      console.error('❌ Erro ao corrigir rede:', error);
      setResult(`❌ Erro: ${error.message}`);
    } finally {
      setIsFixing(false);
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
      <h3>🔧 Corretor de Rede</h3>
      <p>Este componente força a reconexão da rede e sincronização do contrato.</p>
      
      <button 
        onClick={fixNetwork}
        disabled={isFixing}
        style={{
          padding: '10px 20px',
          backgroundColor: isFixing ? '#ccc' : '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isFixing ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isFixing ? '🔄 Corrigindo...' : '🔧 Corrigir Rede'}
      </button>

      {result && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: result.includes('✅') ? '#e8f5e8' : '#ffebee',
          border: `1px solid ${result.includes('✅') ? '#4CAF50' : '#f44336'}`,
          borderRadius: '4px',
          color: result.includes('✅') ? '#2e7d32' : '#d32f2f',
          whiteSpace: 'pre-line'
        }}>
          <strong>Resultado:</strong><br/>{result}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <h4>🔧 O que este corretor faz:</h4>
        <ul>
          <li>Força reconexão da carteira</li>
          <li>Verifica e troca para Polygon Amoy</li>
          <li>Aguarda sincronização da rede</li>
          <li>Testa o contrato com retry</li>
          <li>Mostra informações detalhadas</li>
        </ul>
      </div>
    </div>
  );
};

export default NetworkFixer;


