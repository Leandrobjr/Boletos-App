import { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/apiConfig';

// Hook para conversão BRL <-> USDT com cotação online Coingecko
export function useUSDTConversion() {
  const [taxaConversao, setTaxaConversao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache localStorage para evitar requisições excessivas
  const getCachedRate = () => {
    try {
      const cached = localStorage.getItem('usdt_rate_cache');
      if (cached) {
        const { rate, timestamp } = JSON.parse(cached);
        const now = Date.now();
        // Cache válido por 10 minutos
        if (now - timestamp < 600000) {
          return rate;
        }
      }
    } catch (e) {
      console.error('Erro ao ler cache:', e);
    }
    return null;
  };

  const setCachedRate = (rate) => {
    try {
      localStorage.setItem('usdt_rate_cache', JSON.stringify({
        rate,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Erro ao salvar cache:', e);
    }
  };

  // Busca cotação online via proxy backend (evita CORS)
  const fetchTaxaConversao = async () => {
    // Verificar cache primeiro
    const cachedRate = getCachedRate();
    if (cachedRate) {
      setTaxaConversao(cachedRate);
      return;
    }

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
        setCachedRate(preco); // Salvar no cache
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
    // Inicializar com cache se disponível
    const cachedRate = getCachedRate();
    if (cachedRate) {
      setTaxaConversao(cachedRate);
    } else {
      fetchTaxaConversao();
    }
    
    // Retry automático muito reduzido - apenas a cada 5 minutos se falhar
    const retryInterval = setInterval(() => {
      if (!taxaConversao && !loading) {
        fetchTaxaConversao();
      }
    }, 300000); // 5 minutos
    
    return () => clearInterval(retryInterval);
  }, []); // Remover dependências para evitar loops

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