import { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/apiConfig';

// Hook para conversão BRL <-> USDT com cotação online Coingecko
export function useUSDTConversion() {
  const [taxaConversao, setTaxaConversao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Busca cotação online via proxy backend (evita CORS)
  const fetchTaxaConversao = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(buildApiUrl('/proxy/coingecko?ticker=tether&vs=brl'));
      
      if (!resp.ok) {
        throw new Error(`Erro HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      
      if (data && data.price != null) {
        const preco = Number(data.price);
        setTaxaConversao(preco);
      } else {
        setError('Cotação não encontrada');
      }
    } catch (err) {
      setError(`Erro ao buscar taxa de conversão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxaConversao();
    
    // Retry automático a cada 60 segundos se a primeira tentativa falhar
    const retryInterval = setInterval(() => {
      if (!taxaConversao && !loading) {
        fetchTaxaConversao();
      }
    }, 60000);
    
    return () => clearInterval(retryInterval);
  }, [taxaConversao, loading]);

  // Conversão BRL -> USDT com fallback
  const brlToUsdt = (valorBrl) => {
    if (!taxaConversao) {
      // Fallback: última cotação conhecida ou cotação aproximada
      const fallbackRate = 5.5; // Aproximação quando API falha
      return (Number(valorBrl) / fallbackRate).toFixed(2);
    }
    return (Number(valorBrl) / taxaConversao).toFixed(2);
  };

  // Conversão USDT -> BRL
  const usdtToBrl = (valorUsdt) => {
    if (!taxaConversao) return 0;
    return (Number(valorUsdt) * taxaConversao).toFixed(2);
  };

  return { taxaConversao, brlToUsdt, usdtToBrl, fetchTaxaConversao, loading, error };
} 