import { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/apiConfig';

// Hook para conversão BRL <-> USDT com cotação online Coingecko
export function useUSDTConversion() {
  const [taxaConversao, setTaxaConversao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Busca cotação online via proxy backend (evita CORS)
  const fetchTaxaConversao = async () => {
    console.log('🚀 INICIANDO busca de conversão USDT...');
    setLoading(true);
    setError(null);
    try {
      const url = buildApiUrl('/api/proxy/coingecko?ticker=tether&vs=brl');
      console.log('🔗 URL de conversão:', url);
      
      const resp = await fetch(url);
      console.log('📡 Resposta da API:', {
        status: resp.status,
        statusText: resp.statusText,
        ok: resp.ok
      });
      
      if (!resp.ok) {
        throw new Error(`Erro HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      console.log('📦 Dados recebidos:', data);
      
      if (data && data.price != null) {
        const preco = Number(data.price);
        console.log('✅ CONVERSÃO USDT carregada:', {
          precoOriginal: data.price,
          precoNumerico: preco,
          timestamp: new Date().toISOString()
        });
        setTaxaConversao(preco);
      } else {
        console.error('❌ Dados inválidos recebidos:', data);
        setError('Cotação não encontrada');
      }
    } catch (err) {
      console.error('💥 ERRO na conversão USDT:', err);
      setError(`Erro ao buscar taxa de conversão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxaConversao();
  }, []);

  // Conversão BRL -> USDT com fallback
  const brlToUsdt = (valorBrl) => {
    if (!taxaConversao) {
      console.log('⚠️ Taxa de conversão não disponível, tentando fallback...');
      // Fallback: última cotação conhecida ou cotação aproximada
      const fallbackRate = 5.5; // Aproximação quando API falha
      console.log('🔄 Usando taxa fallback:', fallbackRate);
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