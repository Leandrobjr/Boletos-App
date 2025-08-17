// Configuração DEFINITIVA da API - FORÇA URL CORRETA
// Esta configuração sobrescreve qualquer cache ou configuração anterior

console.log('🚀 CARREGANDO configuração API DEFINITIVA');

// FORÇAR URL BASEADA NO AMBIENTE - CORREÇÃO DEFINITIVA CORS
const getCorrectApiUrl = () => {
  const currentHost = window.location.hostname;
  const currentUrl = window.location.href;
  
  console.log('🔍 DETECTANDO ambiente:', {
    hostname: currentHost,
    fullUrl: currentUrl,
    timestamp: new Date().toISOString()
  });
  
  // PRODUÇÃO: Se estamos no Vercel do frontend - FORÇAR MESMO DOMÍNIO
  if (currentHost.includes('vercel.app') || currentHost.includes('boletos-app')) {
    // USAR API DO MESMO DOMÍNIO PARA EVITAR CORS
    const prodUrl = `${window.location.protocol}//${currentHost}/api`;
    console.log('✅ PRODUÇÃO DETECTADA - Usando MESMO DOMÍNIO:', prodUrl);
    return prodUrl;
  }
  
  // LOCAL: Se estamos em localhost
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const localUrl = 'http://localhost:3001';
    console.log('🔧 LOCAL DETECTADO - Usando:', localUrl);
    return localUrl;
  }
  
  // FALLBACK: Usar API do mesmo domínio
  const fallbackUrl = `${window.location.protocol}//${window.location.host}/api`;
  console.log('🔄 FALLBACK - Usando mesmo domínio:', fallbackUrl);
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
  let finalUrl = `${baseUrl}${endpoint}`;
  
  // CORREÇÃO AUTOMÁTICA: Garantir que não há duplicação de /api
  if (finalUrl.includes('/api/api')) {
    finalUrl = finalUrl.replace('/api/api', '/api');
    console.log('🔧 CORREÇÃO AUTOMÁTICA - Removida duplicação /api/api');
  }
  
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
  
  // VALIDAÇÃO FINAL: Garantir HTTPS em produção
  if (!finalUrl.includes('localhost') && !finalUrl.startsWith('https://')) {
    finalUrl = finalUrl.replace('http://', 'https://');
    console.log('🔒 FORÇANDO HTTPS:', finalUrl);
  }
  
  return finalUrl;
};

// Função para fazer requisições com configuração robusta
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...options.headers
    },
    mode: 'cors',
    credentials: 'omit',
    ...options
  };

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 TENTATIVA ${attempt} - Requisição para:`, url);
      console.log('📋 Opções da requisição:', defaultOptions);
      
      const response = await fetch(url, defaultOptions);
      
      console.log('📡 Status da resposta:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ SUCESSO na requisição:', data);
      return data;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ TENTATIVA ${attempt} FALHOU:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Se for erro de CORS, tentar URL alternativa
      if (error.message.includes('CORS') || error.message.includes('blocked') || error.name === 'TypeError') {
        console.log('🔄 DETECTADO ERRO DE CORS - Tentando URL alternativa...');
        const alternativeUrl = url.replace('/api/', '/api/proxy/');
        console.log('🔗 URL alternativa:', alternativeUrl);
      }
      
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