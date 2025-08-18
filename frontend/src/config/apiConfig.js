// Configuração da API

// FORÇAR URL BASEADA NO AMBIENTE - CORREÇÃO DEFINITIVA CORS
const getCorrectApiUrl = () => {
  const currentHost = window.location.hostname;
  const currentUrl = window.location.href;
  

  
  // PRODUÇÃO: Se estamos no Vercel do frontend - FORÇAR MESMO DOMÍNIO
  if (currentHost.includes('vercel.app') || currentHost.includes('boletos-app')) {
    // USAR API DO MESMO DOMÍNIO PARA EVITAR CORS
    const prodUrl = `${window.location.protocol}//${currentHost}/api`;
    return prodUrl;
  }
  
  // LOCAL: Se estamos em localhost
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // FALLBACK: Usar API do mesmo domínio
  return `${window.location.protocol}//${window.location.host}/api`;
};

// URL BASE FIXA - NÃO PODE SER ALTERADA
const API_BASE_URL = getCorrectApiUrl();



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
  }
  
  // VALIDAÇÃO: Garantir que a URL está correta
  if (finalUrl.includes('bxc-boletos-app.vercel.app')) {
    return finalUrl.replace(/.*bxc-boletos-app\.vercel\.app/, 'https://boletos-backend-290725.vercel.app/api');
  }
  
  // VALIDAÇÃO FINAL: Garantir HTTPS em produção
  if (!finalUrl.includes('localhost') && !finalUrl.startsWith('https://')) {
    finalUrl = finalUrl.replace('http://', 'https://');
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
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export default API_CONFIG;