// Configuração da API para diferentes ambientes
const API_CONFIG = {
  // URL base da API - detecta ambiente automaticamente
  BASE_URL: (() => {
    // Se estiver em produção (Vercel) e não tiver VITE_API_URL configurado
    if (window.location.hostname !== 'localhost' && !import.meta.env.VITE_API_URL) {
      console.warn('⚠️ VITE_API_URL não configurado em produção. Usando fallback.');
      // URL de fallback - você deve substituir pela URL real do seu backend
      return 'https://seu-backend.vercel.app';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  })(),
  
  // Endpoints
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

// Função para construir URLs completas
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Função para fazer requisições com configuração padrão
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  console.log('🌐 Fazendo requisição para:', url);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Erro na requisição API:', error);
    console.error('📡 URL tentada:', url);
    throw error;
  }
};

export default API_CONFIG; 