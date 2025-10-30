// Configuração da API

// FORÇAR SEMPRE PRODUÇÃO - VERCEL BACKEND
const getCorrectApiUrl = () => {
  // SEMPRE usar backend de produção Vercel - NUNCA ambiente local
  return 'https://boletos-app-mocha.vercel.app/api';
};

// URL BASE FIXA - SEMPRE PRODUÇÃO
const API_BASE_URL = getCorrectApiUrl();
// BACKUP EM PRODUÇÃO: backend dedicado Vercel
const API_BACKUP_URL = 'https://boletos-app-mocha.vercel.app/api';



// Configuração da API
const API_CONFIG = {
  // PRODUÇÃO: Usar o deployment mais recente
  BASE_URL: 'https://bxc-boletos-m1ku6p07o-leandro-botacin-juniors-projects.vercel.app',
  
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
    UPLOAD_COMPROVANTE: '/upload-comprovante',  // Endpoint temporário até deployment do -final
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
const fetchWithTimeout = async (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log(`🌐 [API] Fazendo requisição para: ${url}`);
    console.log(`🌐 [API] Método: ${options.method || 'GET'}`);
    console.log(`🌐 [API] Headers:`, options.headers);
    console.log(`🌐 [API] Body:`, options.body);
    
    const resp = await fetch(url, { ...options, signal: controller.signal });
    
    console.log(`🌐 [API] Resposta recebida - Status: ${resp.status}`);
    console.log(`🌐 [API] Headers da resposta:`, Object.fromEntries(resp.headers.entries()));
    
    return resp;
  } catch (error) {
    console.error(`❌ [API] Erro na requisição para ${url}:`, error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

// Função para fazer requisições com configuração robusta
export const apiRequest = async (endpoint, options = {}) => {
  const primaryUrl = buildApiUrl(endpoint);
  
  // Captura de credenciais do cliente (se disponíveis)
  const walletAddress = (window?.bxcWalletAddress) 
    || (window?.ethereum?.selectedAddress)
    || (typeof localStorage !== 'undefined' ? localStorage.getItem('walletAddress') : null)
    || null;
  const idToken = (typeof localStorage !== 'undefined' ? localStorage.getItem('idToken') : null) || null;

  // Preparar headers e serialização automática de body
  const method = (options.method || 'GET').toUpperCase();
  const mutatingMethods = ['POST','PUT','PATCH','DELETE'];
  const extraHeaders = {};
  if (idToken) extraHeaders['Authorization'] = `Bearer ${idToken}`;
  if (walletAddress && mutatingMethods.includes(method)) extraHeaders['X-Wallet-Address'] = walletAddress;

  const initialHeaders = {
    'Accept': 'application/json',
    ...(options.headers || {}),
    ...extraHeaders,
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
    method,
    body,
  };

  const maxRetries = 2; // reduzir para evitar espera longa
  let lastError;

  // Estratégia de fallback: usar caminho relativo como backup
  const candidates = [primaryUrl];
  const isLocal = primaryUrl.includes('localhost');
  const isVercelBackend = primaryUrl.includes('boletos-app-mocha.vercel.app');
  const disableBackup = options.disableBackup === true;
  if (!isLocal && isVercelBackend && !disableBackup) {
    candidates.push('/api' + endpoint);
  }

  for (const url of candidates) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, defaultOptions, 20000);
        
        console.log(`🔍 [API] Processando resposta de ${url}`);
        console.log(`🔍 [API] Status da resposta: ${response.status}`);
        console.log(`🔍 [API] OK: ${response.ok}`);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          console.error(`❌ [API] Resposta não OK - Status: ${response.status}, Texto: ${errorText}`);
          
          // Não repetir em erros 4xx (cliente)
          if (response.status >= 400 && response.status < 500) {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            break; // sair do loop de tentativas para este candidato
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        console.log(`🔍 [API] Content-Type: ${contentType}`);
        
        if (contentType.includes('application/json')) {
          const jsonData = await response.json();
          console.log(`✅ [API] Dados JSON recebidos:`, jsonData);
          return jsonData;
        }
        
        // Fallback para texto em sucesso
        const textData = await response.text();
        console.log(`✅ [API] Dados de texto recebidos:`, textData);
        return { success: true, text: textData };
        
      } catch (error) {
        console.error(`❌ [API] Erro na tentativa ${attempt}/${maxRetries} para ${url}:`, error);
        lastError = error;
        // Em AbortError ou network error, aplicar backoff exponencial
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
          console.log(`⏳ [API] Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  throw lastError;
};

export default API_CONFIG;