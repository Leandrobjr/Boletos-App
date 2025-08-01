// Configuração DEFINITIVA da API - FORÇA URL CORRETA
// Esta configuração sobrescreve qualquer cache ou configuração anterior

console.log('🚀 CARREGANDO configuração API DEFINITIVA');

// FORÇAR URL BASEADA NO AMBIENTE - SEM DEPENDÊNCIAS EXTERNAS
const getCorrectApiUrl = () => {
  const currentHost = window.location.hostname;
  const currentUrl = window.location.href;
  
  console.log('🔍 DETECTANDO ambiente:', {
    hostname: currentHost,
    fullUrl: currentUrl,
    timestamp: new Date().toISOString()
  });
  
  // PRODUÇÃO: Se estamos no Vercel do frontend
  if (currentHost.includes('vercel.app') || currentHost.includes('boletos-app')) {
    const prodUrl = 'https://boletos-backend-290725.vercel.app/api';
    console.log('✅ PRODUÇÃO DETECTADA - Usando:', prodUrl);
    return prodUrl;
  }
  
  // LOCAL: Se estamos em localhost
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const localUrl = 'http://localhost:3001';
    console.log('🔧 LOCAL DETECTADO - Usando:', localUrl);
    return localUrl;
  }
  
  // FALLBACK: Sempre usar produção se não conseguir detectar
  const fallbackUrl = 'https://boletos-backend-290725.vercel.app/api';
  console.log('🔄 FALLBACK - Usando:', fallbackUrl);
  return fallbackUrl;
};

// URL BASE FIXA - NÃO PODE SER ALTERADA
const API_BASE_URL = getCorrectApiUrl();

console.log('🎯 URL BASE DEFINITIVA:', API_BASE_URL);

// Configuração da API
const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  
  // Endpoints da API
  ENDPOINTS: {
    BOLETOS: '/boletos',
    USERS: '/users', 
    PERFIL: '/perfil',
    BOLETOS_USUARIO: (uid) => `/boletos/usuario/${uid}`,
    BOLETOS_COMPRADOS: (uid) => `/boletos/comprados/${uid}`,
    PERFIL_USUARIO: (uid) => `/perfil/${uid}`,
    RESERVAR_BOLETO: (numeroControle) => `/boletos/${numeroControle}/reservar`,
    LIBERAR_BOLETO: (numeroControle) => `/boletos/${numeroControle}/liberar`,
    COMPROVANTE_BOLETO: (numeroControle) => `/boletos/${numeroControle}/comprovante`,
    BAIXAR_BOLETO: (numeroControle) => `/boletos/${numeroControle}/baixar`,
    CANCELAR_BOLETO: (id) => `/boletos/${id}/cancelar`,
    DISPUTA_BOLETO: (id) => `/boletos/${id}/disputa`,
    DESTRAVAR_BOLETO: (id) => `/boletos/${id}/destravar`,
  }
};

// Função para construir URLs - SEMPRE FORÇA A URL CORRETA
export const buildApiUrl = (endpoint) => {
  // REFORÇAR: Sempre usar a URL base correta
  const baseUrl = getCorrectApiUrl();
  const finalUrl = `${baseUrl}${endpoint}`;
  
  console.log('🔗 CONSTRUINDO URL:', {
    baseUrl,
    endpoint,
    finalUrl,
    timestamp: new Date().toISOString()
  });
  
  // VALIDAÇÃO: Garantir que a URL está correta
  if (finalUrl.includes('bxc-boletos-app.vercel.app')) {
    console.error('❌ URL INCORRETA DETECTADA:', finalUrl);
    // FORÇAR correção
    const correctedUrl = finalUrl.replace(/.*bxc-boletos-app\.vercel\.app/, 'https://boletos-backend-290725.vercel.app/api');
    console.log('🔧 URL CORRIGIDA PARA:', correctedUrl);
    return correctedUrl;
  }
  
  return finalUrl;
};

// Função para fazer requisições com configuração robusta
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 TENTATIVA ${attempt} - Requisição para:`, url);
      
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ SUCESSO na requisição');
      return data;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ TENTATIVA ${attempt} FALHOU:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Aguardando ${delay}ms para próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('💥 TODAS AS TENTATIVAS FALHARAM:', lastError.message);
  throw lastError;
};

// Validação final
console.log('✅ CONFIGURAÇÃO API CARREGADA:', {
  baseUrl: API_CONFIG.BASE_URL,
  isProduction: !API_CONFIG.BASE_URL.includes('localhost'),
  timestamp: new Date().toISOString()
});

export default API_CONFIG;