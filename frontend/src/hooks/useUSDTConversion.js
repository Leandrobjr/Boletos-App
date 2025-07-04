import { useState } from 'react';

// Hook para conversão BRL <-> USDT
export function useUSDTConversion() {
  const [taxaConversao, setTaxaConversao] = useState(5.0); // valor fixo, substituir por API futuramente
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Placeholder para buscar taxa em API externa
  const fetchTaxaConversao = async () => {
    setLoading(true);
    setError(null);
    try {
      // Exemplo: buscar na Binance/Coingecko
      // const response = await fetch('API_URL');
      // const data = await response.json();
      // setTaxaConversao(data.valor);
      setTaxaConversao(5.0); // valor fixo por enquanto
    } catch (err) {
      setError('Erro ao buscar taxa de conversão');
    } finally {
      setLoading(false);
    }
  };

  // Conversão BRL -> USDT
  const brlToUsdt = (valorBrl) => {
    if (!taxaConversao) return 0;
    return (parseFloat(valorBrl) / taxaConversao).toFixed(2);
  };

  // Conversão USDT -> BRL
  const usdtToBrl = (valorUsdt) => {
    if (!taxaConversao) return 0;
    return (parseFloat(valorUsdt) * taxaConversao).toFixed(2);
  };

  return { taxaConversao, brlToUsdt, usdtToBrl, fetchTaxaConversao, loading, error };
} 