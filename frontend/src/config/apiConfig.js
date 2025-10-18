// Configuração da API

// FORÇAR URL BASEADA NO AMBIENTE - padronizar produção com caminho relativo /api
const getCorrectApiUrl = () => {
  const currentHost = window.location.hostname;

  // LOCAL: sempre apontar para o backend local com /api
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }

  // PRODUÇÃO: consumir via caminho relativo para acionar o rewrite
  return '/api';
};

// URL BASE FIXA - NÃO PODE SER ALTERADA
const API_BASE_URL = getCorrectApiUrl();
// BACKUP EM PRODUÇÃO: backend dedicado Vercel
const API_BACKUP_URL = 'https://boletos-backend-290725.vercel.app/api';



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
  
  // VALIDAÇÃO FINAL: Garantir HTTPS em produção
  if (!finalUrl.includes('localhost') && !finalUrl.startsWith('https://')) {
    finalUrl = finalUrl.replace('http://', 'https://');
  }
  
  return finalUrl;
};

// Helper: fetch com timeout por tentativa
const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
};

// Função para fazer requisições com configuração robusta
export const apiRequest = async (endpoint, options = {}) => {
  const primaryUrl = buildApiUrl(endpoint);
  
  // Preparar headers e serialização automática de body
  const initialHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...(options.headers || {})
  };
  
  let body = options.body;
  let headers = { ...initialHeaders };
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  
  const defaultOptions = {
    headers,
    mode: 'cors',
    credentials: 'omit',
    method: options.method || 'GET',
    body,
  };

  const maxRetries = 2; // reduzir para evitar espera longa
  let lastError;

  // Estratégia de fallback: se produção estiver usando caminho relativo /api, tentar backend dedicado
  const candidates = [primaryUrl];
  const isLocal = primaryUrl.includes('localhost');
  const isRelativeApi = primaryUrl.startsWith('/api');
  if (!isLocal && isRelativeApi) {
    candidates.push(`${API_BACKUP_URL}${endpoint}`);
  }

  for (const url of candidates) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, defaultOptions, 12000);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          // Não repetir em erros 4xx (cliente)
          if (response.status >= 400 && response.status < 500) {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            break; // sair do loop de tentativas para este candidato
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        }
        // Fallback para texto em sucesso
        return { success: true, text: await response.text() };
        
      } catch (error) {
        lastError = error;
        // Em AbortError ou network error, aplicar backoff exponencial
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  throw lastError;
};

export default API_CONFIG;