/**
 * authManager.js
 * Serviço centralizado para gerenciamento de autenticação seguindo as melhores práticas do Firebase
 * Implementa padrões de segurança e tratamento de erros adequados
 */

import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { app } from "./firebaseConfig";

// Obter instância de autenticação
const auth = getAuth(app);

// Configurar provedor Google com escopo mínimo necessário
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Configurar persistência local para evitar problemas com cookies bloqueados
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('Erro ao configurar persistência:', error);
});

// Verificar se o navegador tem proteção contra rastreamento ativa
const detectTrackingPrevention = () => {
  // Safari e alguns navegadores baseados em WebKit podem ter proteção contra rastreamento
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
  
  // Verificar se localStorage e cookies estão disponíveis
  let hasLocalStorage = false;
  let hasCookies = false;
  
  try {
    // Testar localStorage
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    hasLocalStorage = true;
    
    // Testar cookies
    document.cookie = 'testcookie=1; SameSite=None; Secure';
    hasCookies = document.cookie.indexOf('testcookie=') !== -1;
  } catch (e) {
    console.warn('Detectado possível bloqueio de armazenamento:', e);
  }
  
  return {
    possibleTrackingPrevention: (isSafari || isFirefox) && (!hasLocalStorage || !hasCookies),
    browserInfo: {
      isSafari,
      isFirefox,
      hasLocalStorage,
      hasCookies
    }
  };
};

// Função para iniciar login com Google via redirecionamento
export const signInWithGoogle = async () => {
  try {
    // Verificar proteção contra rastreamento
    const { possibleTrackingPrevention, browserInfo } = detectTrackingPrevention();
    if (possibleTrackingPrevention) {
      console.warn('Possível proteção contra rastreamento detectada:', browserInfo);
    }
    
    // Adicionar parâmetros para evitar problemas de cache e cookies
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      login_hint: window.location.hostname
    });
    
    // Marcar que estamos iniciando um processo de autenticação
    try {
      sessionStorage.setItem('auth_pending', 'true');
      localStorage.setItem('auth_pending', 'true');
      localStorage.setItem('auth_timestamp', Date.now().toString());
    } catch (storageError) {
      console.warn('Não foi possível armazenar estado de autenticação:', storageError);
      // Se não conseguimos armazenar, pode ser proteção contra rastreamento
      if (possibleTrackingPrevention) {
        throw {
          code: 'auth/tracking-prevention',
          message: 'Seu navegador está bloqueando cookies e armazenamento local necessários para autenticação. Tente desativar a proteção contra rastreamento ou use outro navegador.'
        };
      }
    }
    
    // Iniciar o processo de redirecionamento
    await signInWithRedirect(auth, googleProvider);
    
    // Este código só será executado se o redirecionamento falhar
    return { success: true };
  } catch (error) {
    console.error('Erro ao iniciar login com Google:', error);
    return { success: false, error };
  }
};

// Função para verificar resultado do redirecionamento
export const checkRedirectResult = async () => {
  try {
    // Verificar se temos um timestamp de autenticação
    const authTimestamp = localStorage.getItem('auth_timestamp');
    const currentTime = Date.now();
    const timeElapsed = authTimestamp ? currentTime - parseInt(authTimestamp) : 0;
    
    // Limpar flags de autenticação pendente
    try {
      sessionStorage.removeItem('auth_pending');
      localStorage.removeItem('auth_pending');
      localStorage.removeItem('auth_timestamp');
    } catch (storageError) {
      console.warn('Não foi possível limpar estado de autenticação:', storageError);
    }
    
    // Se o tempo desde o início da autenticação for muito curto (< 2 segundos),
    // pode ser que o redirecionamento foi bloqueado
    if (authTimestamp && timeElapsed < 2000) {
      console.warn('Redirecionamento possivelmente bloqueado - tempo muito curto:', timeElapsed);
      throw {
        code: 'auth/tracking-prevention',
        message: 'O redirecionamento para autenticação foi bloqueado. Seu navegador pode estar com proteção contra rastreamento ativada. Tente desativar essa proteção ou use outro navegador.'
      };
    }
    
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      console.log('Login com Google bem-sucedido via redirecionamento');
      return { success: true, user: result.user };
    }
    
    // Se não há resultado mas também não há erro, pode ser que não estamos
    // retornando de um redirecionamento
    return { success: true };
  } catch (error) {
    console.error('Erro ao verificar resultado do redirecionamento:', error);
    
    // Verificar se é um erro relacionado à proteção contra rastreamento
    if (error.code === 'auth/web-storage-unsupported' ||
        error.code === 'auth/network-request-failed' ||
        error.code === 'auth/cookies-blocked' ||
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user') {
      error.code = 'auth/tracking-prevention';
      error.message = 'Seu navegador está bloqueando cookies ou armazenamento local necessários para autenticação. Tente desativar a proteção contra rastreamento nas configurações do navegador ou use outro navegador como Chrome ou Edge.';
    }
    
    // Ignorar erro de usuário nulo (ocorre quando não há redirecionamento pendente)
    if (error.code === 'auth/null-user') {
      return { success: true, user: null };
    }
    
    // Verificar se o erro está relacionado à proteção contra rastreamento
    if (error.message && (error.message.includes('Tracking Prevention') || 
                          error.message.includes('third-party cookies') || 
                          error.message.includes('storage access'))) {
      return { 
        success: false, 
        error: {
          code: 'auth/tracking-prevention',
          message: 'A proteção contra rastreamento do navegador está bloqueando a autenticação. Tente desativar temporariamente essa proteção ou use outro navegador.'
        }
      };
    }
    
    return { 
      success: false, 
      error: {
        code: error.code || 'auth/unknown',
        message: error.message || 'Erro desconhecido ao processar redirecionamento'
      }
    };
  }
};

/**
 * Observa mudanças no estado de autenticação
 * @param {Function} callback - Função a ser chamada quando o estado mudar
 * @returns {Function} - Função para cancelar a inscrição
 */
const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('Usuário autenticado:', user.displayName);
    } else {
      console.log('Usuário não autenticado');
    }
    
    callback(user);
  });
};

/**
 * Realiza logout do usuário
 */
const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { 
      success: false, 
      error: {
        code: error.code || 'auth/unknown',
        message: error.message || 'Erro desconhecido ao fazer logout'
      }
    };
  }
};

/**
 * Obtém o usuário atual
 * @returns {Object|null} - Usuário atual ou null se não autenticado
 */
const getCurrentUser = () => {
  return auth.currentUser;
};

// Exportar funções do serviço de autenticação
export {
  auth,
  googleProvider,
  signInWithGoogle,
  checkRedirectResult,
  subscribeToAuthChanges,
  signOutUser,
  getCurrentUser
};
