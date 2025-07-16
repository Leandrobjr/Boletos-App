import { useState, useEffect } from 'react';

// Hook para conversão BRL <-> USDT com cotação online Coingecko
export function useUSDTConversion() {
  const [taxaConversao, setTaxaConversao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Busca cotação online na Coingecko
  const fetchTaxaConversao = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl');
      const data = await resp.json();
      if (data && data.tether && data.tether.brl) {
        setTaxaConversao(data.tether.brl);
      } else {
        setError('Cotação não encontrada');
      }
    } catch (err) {
      setError('Erro ao buscar taxa de conversão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxaConversao();
  }, []);

  // Conversão BRL -> USDT
  const brlToUsdt = (valorBrl) => {
    if (!taxaConversao) return 0;
    return (Number(valorBrl) / taxaConversao).toFixed(2);
  };

  // Conversão USDT -> BRL
  const usdtToBrl = (valorUsdt) => {
    if (!taxaConversao) return 0;
    return (Number(valorUsdt) * taxaConversao).toFixed(2);
  };

  return { taxaConversao, brlToUsdt, usdtToBrl, fetchTaxaConversao, loading, error };
} 