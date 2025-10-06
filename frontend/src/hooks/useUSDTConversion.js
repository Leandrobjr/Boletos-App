import { useState, useEffect, useCallback } from 'react';
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
        // Cache válido por 30 minutos (aumentado para reduzir requisições)
        if (now - timestamp < 1800000) {
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

  // Busca cotação online via proxy backend (evita CORS) - Estabilizada com useCallback
  const fetchTaxaConversao = useCallback(async () => {
    // Verificar cache primeiro
    const cachedRate = getCachedRate();
    if (cachedRate) {
      setTaxaConversao(cachedRate);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(buildApiUrl('/api/proxy/coingecko?ticker=tether&vs=brl'));
      
      if (!resp.ok) {
        throw new Error(`Erro HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      
      // Backend retorna: { tether: { brl: 5.34 } }
      // Frontend esperava: { price: 5.34 }
      let preco = null;
      
      if (data && data.tether && data.tether.brl != null) {
        preco = Number(data.tether.brl);
      } else if (data && data.price != null) {
        preco = Number(data.price);
      }
      
      if (preco && preco > 0) {
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
  }, []); // useCallback sem dependências porque não usa states/props externos

  useEffect(() => {
    // Inicializar com cache se disponível
    const cachedRate = getCachedRate();
    if (cachedRate) {
      setTaxaConversao(cachedRate);
    } else {
      fetchTaxaConversao();
    }
    
    // POLLING COMPLETAMENTE DESABILITADO - estava causando rate limit 429
    // const retryInterval = setInterval(() => {
    //   if (!taxaConversao && !loading) {
    //     fetchTaxaConversao();
    //   }
    // }, 300000); // 5 minutos
    
    // return () => clearInterval(retryInterval);
  }, [fetchTaxaConversao]); // Incluir fetchTaxaConversao estabilizada no array de dependências

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