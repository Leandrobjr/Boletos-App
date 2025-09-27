import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const BalanceChecker = () => {
  const [balance, setBalance] = useState('0');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const MOCK_USDT = '0xB160a30D1612756AF9F6498d47384638D73b953e';

  const checkBalance = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        throw new Error('MetaMask não encontrado');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);

      const usdt = new ethers.Contract(MOCK_USDT, [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ], provider);

      const decimals = await usdt.decimals();
      const balanceWei = await usdt.balanceOf(userAddress);
      const balanceFormatted = ethers.formatUnits(balanceWei, decimals);
      
      setBalance(balanceFormatted);
      console.log('💰 Saldo atual:', balanceFormatted, 'USDT');
      
    } catch (error) {
      console.error('❌ Erro ao verificar saldo:', error);
      setBalance('Erro');
    } finally {
      setLoading(false);
    }
  };

  // Auto-check ao montar o componente
  useEffect(() => {
    checkBalance();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-bold text-gray-800 mb-4">💰 Saldo USDT</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Carteira:</strong> 
          <span className="font-mono text-sm ml-2 break-all">
            {address || 'Não conectado'}
          </span>
        </div>
        
        <div>
          <strong>Saldo:</strong> 
          <span className="text-2xl font-bold text-green-600 ml-2">
            {loading ? '⏳ Carregando...' : `${balance} USDT`}
          </span>
        </div>
        
        <button
          onClick={checkBalance}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Verificando...' : '🔄 Atualizar Saldo'}
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <div>MockUSDT: {MOCK_USDT}</div>
        <div>Rede: Polygon Amoy</div>
      </div>
    </div>
  );
};

export default BalanceChecker;

