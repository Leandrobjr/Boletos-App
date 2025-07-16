/**
 * tokenAuthManager.js
 * Sistema de autenticação robusto baseado em tokens personalizados
 * Projetado para funcionar mesmo com proteções contra rastreamento ativas
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
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from "firebase/auth";
import { app } from "./firebaseConfig";

// Obter instância de autenticação
const auth = getAuth(app);

// Configurar provedor Google
export const googleProvider = new GoogleAuthProvider();
// Adicionar escopos necessários (apenas os essenciais)
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Otimizar configurações do provedor para melhor performance
googleProvider.setCustomParameters({
  // Solicitar apenas o necessário
  prompt: 'select_account',
  // Reduzir dados solicitados
  access_type: 'online', // Não solicitar refresh token para melhorar performance
  // Incluir timestamp para evitar cache
  state: `auth_${Date.now()}`
});

// Verificar suporte a armazenamento local
const checkStorageSupport = () => {
  try {
    // Testar localStorage
    localStorage.setItem('auth_test', 'test');
    localStorage.removeItem('auth_test');
    return { localStorage: true };
  } catch (e) {
    console.warn('localStorage não suportado ou bloqueado:', e);
    return { localStorage: false };
  }
};

// Escolher o melhor método de persistência com base no suporte do navegador
const configurePersistence = async () => {
  const { localStorage } = checkStorageSupport();
  
  try {
    if (localStorage) {
      // Preferir persistência local se disponível
      await setPersistence(auth, browserLocalPersistence);
      console.log('Usando persistência local');
    } else {
      // Tentar persistência de sessão se localStorage não estiver disponível
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.log('Usando persistência de sessão');
      } catch (e) {
        // Último recurso: persistência em memória (usuário terá que fazer login novamente ao recarregar)
        await setPersistence(auth, inMemoryPersistence);
        console.log('Usando persistência em memória');
      }
    }
    return true;
  } catch (error) {
    console.error('Erro ao configurar persistência:', error);
    return false;
  }
};

// Armazenar token em todas as opções disponíveis
const storeAuthToken = (token) => {
  // Tentar múltiplos métodos de armazenamento para aumentar a chance de sucesso
  try {
    // 1. localStorage (mais persistente)
    localStorage.setItem('auth_token', token);
  } catch (e) {
    console.warn('Não foi possível armazenar token no localStorage');
  }
  
  try {
    // 2. sessionStorage (dura até o fechamento da aba)
    sessionStorage.setItem('auth_token', token);
  } catch (e) {
    console.warn('Não foi possível armazenar token no sessionStorage');
  }
  
  try {
    // 3. Cookie (funciona mesmo com algumas proteções)
    document.cookie = `auth_token=${token}; path=/; SameSite=Strict; max-age=86400`;
  } catch (e) {
    console.warn('Não foi possível armazenar token em cookie');
  }
};

// Recuperar token da melhor fonte disponível
const getAuthToken = () => {
  // Tentar recuperar de múltiplas fontes
  let token;
  
  // 1. Verificar localStorage
  try {
    token = localStorage.getItem('auth_token');
    if (token) return token;
  } catch (e) {}
  
  // 2. Verificar sessionStorage
  try {
    token = sessionStorage.getItem('auth_token');
    if (token) return token;
  } catch (e) {}
  
  // 3. Verificar cookies
  try {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token') return value;
    }
  } catch (e) {}
  
  return null;
};

// Limpar token de todas as fontes
const clearAuthToken = () => {
  try {
    localStorage.removeItem('auth_token');
  } catch (e) {}
  
  try {
    sessionStorage.removeItem('auth_token');
  } catch (e) {}
  
  try {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch (e) {}
};

// Função para iniciar login com Google via redirecionamento
export const signInWithGoogle = async () => {
  try {
    console.log('Iniciando processo de login com Google...');
    
    // Limpar quaisquer erros anteriores
    try {
      localStorage.removeItem('auth_error');
      sessionStorage.removeItem('auth_error');
    } catch (e) {}
    
    // Configurar persistência adequada
    await configurePersistence();
    
    // Detectar se estamos em um navegador com proteção contra rastreamento
    let trackingProtectionActive = false;
    try {
      localStorage.setItem('_test_storage', '1');
      localStorage.removeItem('_test_storage');
    } catch (e) {
      console.warn('Proteção contra rastreamento detectada:', e);
      trackingProtectionActive = true;
    }
    
    // Verificar se já temos um usuário autenticado
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('Usuário já autenticado:', currentUser.displayName);
      try {
        // Atualizar token
        const token = await currentUser.getIdToken(true);
        storeAuthToken(token);
        
        // Armazenar informações básicas do usuário
        try {
          const userInfo = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          };
          localStorage.setItem('auth_user', JSON.stringify(userInfo));
          sessionStorage.setItem('auth_user', JSON.stringify(userInfo));
        } catch (e) {}
        
        return { success: true, user: currentUser };
      } catch (tokenErr) {
        console.warn('Erro ao obter token do usuário atual:', tokenErr);
        // Continuar com o processo de login para renovar a autenticação
      }
    }
    
    // Obter a URL atual para usar como base para o redirecionamento
    const currentUrl = window.location.origin;
    console.log('URL base para redirecionamento:', currentUrl);
    
    // Verificar se a URL tem a porta correta (3002 para desenvolvimento local)
    if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
      const urlObj = new URL(currentUrl);
      if (urlObj.port !== '5173') {
        console.warn(`AVISO: Porta atual (${urlObj.port}) pode não corresponder à porta configurada no Firebase (3002)`);
        // Não modificamos a URL aqui, apenas alertamos
      }
    }
    
    // Otimizar parâmetros para melhor performance e compatibilidade
    const customParams = {
      // Solicitar apenas o necessário
      prompt: 'select_account',
      // Incluir timestamp para evitar cache
      state: `auth_${Date.now()}`,
      // Reduzir dados solicitados
      access_type: 'online', // Não solicitar refresh token para melhorar performance
      // Definir URL de redirecionamento correta com a porta atual
      redirect_uri: `${currentUrl}/login`
    };
    
    // Adicionar parâmetros específicos para navegadores com proteção contra rastreamento
    if (trackingProtectionActive) {
      customParams.ux_mode = 'redirect';
      // Forçar modo de compatibilidade para navegadores com proteção contra rastreamento
      customParams.prompt = 'consent'; // Sempre mostrar tela de consentimento
      customParams.include_granted_scopes = 'false'; // Não incluir escopos já concedidos
    } else {
      // Usar o domínio atual como dica apenas quando não há proteção contra rastreamento
      customParams.login_hint = window.location.hostname;
    }
    
    googleProvider.setCustomParameters(customParams);
    
    // Marcar que estamos iniciando um processo de autenticação
    try {
      // Usar múltiplas formas de armazenamento para contornar bloqueios
      sessionStorage.setItem('auth_pending', 'true');
      localStorage.setItem('auth_pending', 'true');
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      // Usar cookies como fallback (com diferentes configurações para maior compatibilidade)
      document.cookie = `auth_pending=true; path=/; SameSite=Strict; max-age=3600`;
      document.cookie = `auth_timestamp=${Date.now()}; path=/; SameSite=Strict; max-age=3600`;
      document.cookie = `auth_pending_lax=true; path=/; SameSite=Lax; max-age=3600`; // Versão mais permissiva
      
      // Armazenar URL atual para redirecionamento após login
      const returnUrl = window.location.pathname + window.location.search;
      if (returnUrl !== '/login') {
        localStorage.setItem('auth_return_url', returnUrl);
        sessionStorage.setItem('auth_return_url', returnUrl);
      }
      
      // Configurar opções adicionais para o Google Provider
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Tentando autenticação com método direto...');
      
      try {
        // Usar signInWithPopup com configurações para evitar problemas COOP
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Login com popup bem-sucedido');
        return { success: true, user: result.user };
      } catch (error) {
        console.error('Erro durante autenticação:', error);
        
        // Verificar se é um erro relacionado a COOP ou bloqueio de popup
        if (error.code === 'auth/popup-blocked' || 
            error.code === 'auth/popup-closed-by-user' || 
            error.message?.includes('Cross-Origin-Opener-Policy') ||
            error.message?.includes('Tracking Prevention')) {
          
          console.log('Detectado problema com popup ou COOP, tentando com redirecionamento...');
          
          try {
            // Configurar opções específicas para redirecionamento
            googleProvider.setCustomParameters({
              prompt: 'select_account',
              // Usar o domínio atual diretamente
              redirect_uri: `${window.location.origin}/login`
            });
            
            // Armazenar estado para verificar após redirecionamento
            localStorage.setItem('auth_pending', 'true');
            sessionStorage.setItem('auth_pending', 'true');
            document.cookie = `auth_pending=true; path=/; max-age=300; SameSite=None; Secure`;
            
            // Usar redirecionamento como última opção
            await signInWithRedirect(auth, googleProvider);
            
            // Este código só será executado se o redirecionamento falhar
            console.log('Redirecionamento não ocorreu como esperado');
            return { success: false, error: { code: 'auth/redirect-failed', message: 'O redirecionamento para autenticação falhou. Tente novamente.' } };
          } catch (redirectError) {
            console.error('Erro durante o redirecionamento:', redirectError);
            return { success: false, error: redirectError };
          }
        }
        
        return { success: false, error };
      }
    } catch (error) {
      console.error('Erro ao iniciar login com Google:', error);
      
      // Verificar se o erro está relacionado à proteção contra rastreamento
      if (error.code === 'auth/tracking-prevention' || 
          (typeof error.message === 'string' && 
           (error.message.includes('Tracking Prevention') || 
            error.message.includes('storage') || 
            error.message.includes('cookie') ||
            error.message.includes('third-party') ||
            error.message.includes('third party') ||
            error.message.includes('blocked')))) {
        
        error.code = 'auth/tracking-prevention';
        error.message = 'Seu navegador está bloqueando cookies ou armazenamento local necessários para autenticação. Tente desativar a proteção contra rastreamento nas configurações do navegador ou use outro navegador como Chrome ou Edge.';
        
        // Registrar o tipo de navegador para diagnóstico
        const userAgent = navigator.userAgent;
        console.log('Proteção contra rastreamento detectada no navegador:', userAgent);
        
        // Tentar usar modo de compatibilidade
        console.log('Tentando usar modo de compatibilidade para proteção contra rastreamento');
        try {
          // Usar cookies como única opção de armazenamento com diferentes configurações
          document.cookie = `auth_pending=true; path=/; SameSite=Strict; max-age=3600`;
          document.cookie = `auth_timestamp=${Date.now()}; path=/; SameSite=Strict; max-age=3600`;
          document.cookie = `auth_pending_lax=true; path=/; SameSite=Lax; max-age=3600`;
          document.cookie = `auth_pending_none=true; path=/; SameSite=None; Secure; max-age=3600`;
          
          // Tentar novamente com configurações mínimas
          googleProvider.setCustomParameters({
            prompt: 'consent',
            state: `auth_retry_${Date.now()}`,
            redirect_uri: `${window.location.origin}/login`
          });
        } catch (retryError) {
          console.error('Falha no modo de compatibilidade:', retryError);
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        error.message = 'A janela de login foi fechada antes de concluir a autenticação. Tente novamente.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        error.message = 'O processo de login foi cancelado. Tente novamente.';
      } else if (error.code === 'auth/network-request-failed') {
        error.message = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.code === 'auth/timeout') {
        error.message = 'Tempo esgotado durante o login. Tente novamente.';
      } else if (error.code === 'auth/web-storage-unsupported') {
        error.message = 'Seu navegador não suporta armazenamento web necessário para login. Tente outro navegador.';
      }
      
      // Tentar armazenar o erro para recuperação após redirecionamento
      try {
        const errorData = { code: error.code, message: error.message };
        localStorage.setItem('auth_error', JSON.stringify(errorData));
        sessionStorage.setItem('auth_error', JSON.stringify(errorData));
        document.cookie = `auth_error=${encodeURIComponent(JSON.stringify(errorData))}; path=/; SameSite=Strict; max-age=3600`;
      } catch (e) {}
      
      return { success: false, error };
    }
  } catch (error) {
    console.error('Erro ao iniciar login com Google:', error);
    
    // Verificar se o erro está relacionado à proteção contra rastreamento
    if (error.code === 'auth/tracking-prevention' || 
        (typeof error.message === 'string' && 
         (error.message.includes('Tracking Prevention') || 
          error.message.includes('storage') || 
          error.message.includes('cookie') ||
          error.message.includes('third-party') ||
          error.message.includes('third party') ||
          error.message.includes('blocked')))) {
      
      error.code = 'auth/tracking-prevention';
      error.message = 'Seu navegador está bloqueando cookies ou armazenamento local necessários para autenticação. Tente desativar a proteção contra rastreamento nas configurações do navegador ou use outro navegador como Chrome ou Edge.';
      
      // Registrar o tipo de navegador para diagnóstico
      const userAgent = navigator.userAgent;
      console.log('Proteção contra rastreamento detectada no navegador:', userAgent);
      
      // Tentar usar modo de compatibilidade
      console.log('Tentando usar modo de compatibilidade para proteção contra rastreamento');
      try {
        // Usar cookies como única opção de armazenamento com diferentes configurações
        document.cookie = `auth_pending=true; path=/; SameSite=Strict; max-age=3600`;
        document.cookie = `auth_timestamp=${Date.now()}; path=/; SameSite=Strict; max-age=3600`;
        document.cookie = `auth_pending_lax=true; path=/; SameSite=Lax; max-age=3600`;
        document.cookie = `auth_pending_none=true; path=/; SameSite=None; Secure; max-age=3600`;
        
        // Tentar novamente com configurações mínimas
        googleProvider.setCustomParameters({
          prompt: 'consent',
          state: `auth_retry_${Date.now()}`,
          redirect_uri: `${window.location.origin}/login`
        });
      } catch (retryError) {
        console.error('Falha no modo de compatibilidade:', retryError);
      }
    } else if (error.code === 'auth/popup-closed-by-user') {
      error.message = 'A janela de login foi fechada antes de concluir a autenticação. Tente novamente.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      error.message = 'O processo de login foi cancelado. Tente novamente.';
    } else if (error.code === 'auth/network-request-failed') {
      error.message = 'Erro de conexão. Verifique sua internet e tente novamente.';
    } else if (error.code === 'auth/timeout') {
      error.message = 'Tempo esgotado durante o login. Tente novamente.';
    } else if (error.code === 'auth/web-storage-unsupported') {
      error.message = 'Seu navegador não suporta armazenamento web necessário para login. Tente outro navegador.';
    }
    
    // Tentar armazenar o erro para recuperação após redirecionamento
    try {
      const errorData = { code: error.code, message: error.message };
      localStorage.setItem('auth_error', JSON.stringify(errorData));
      sessionStorage.setItem('auth_error', JSON.stringify(errorData));
      document.cookie = `auth_error=${encodeURIComponent(JSON.stringify(errorData))}; path=/; SameSite=Strict; max-age=3600`;
    } catch (e) {}
    
    return { success: false, error };
  }
};

// Função para verificar resultado do redirecionamento
export const checkRedirectResult = async () => {
  try {
    console.log('Verificando resultado do redirecionamento...');
    
    // Limpar flags de autenticação pendente
    try {
      sessionStorage.removeItem('auth_pending');
      localStorage.removeItem('auth_pending');
      
      // Limpar cookies também
      document.cookie = 'auth_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'auth_pending_lax=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'auth_pending_none=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'auth_timestamp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {}
    
    // Verificar se há URL de retorno salva
    let returnUrl;
    try {
      returnUrl = localStorage.getItem('auth_return_url') || sessionStorage.getItem('auth_return_url');
    } catch (e) {}
    
    // Limpar URL de retorno
    try {
      localStorage.removeItem('auth_return_url');
      sessionStorage.removeItem('auth_return_url');
    } catch (e) {}
    
    // Adicionar tratamento especial para proteção contra rastreamento
    const trackingProtectionActive = (() => {
      try {
        // Tentar detectar se a proteção contra rastreamento está ativa
        localStorage.setItem('_test_storage', '1');
        localStorage.removeItem('_test_storage');
        return false;
      } catch (e) {
        console.warn('Proteção contra rastreamento detectada:', e);
        return true;
      }
    })();
    
    if (trackingProtectionActive) {
      console.warn('Usando modo de compatibilidade para proteção contra rastreamento');
    }
    
    // Verificar se há um erro armazenado de tentativa anterior
    let storedError = null;
    try {
      const errorStr = localStorage.getItem('auth_error') || sessionStorage.getItem('auth_error');
      if (errorStr) {
        storedError = JSON.parse(errorStr);
        console.warn('Erro anterior encontrado:', storedError);
        
        // Limpar erro armazenado
        localStorage.removeItem('auth_error');
        sessionStorage.removeItem('auth_error');
        document.cookie = 'auth_error=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (e) {}
    
    // Tentar obter o resultado do redirecionamento com timeout e retry
    const getRedirectResultWithRetry = async (retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          console.log(`Tentativa ${i + 1} de obter resultado do redirecionamento...`);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Tempo esgotado na tentativa ${i + 1}`)), 5000);
          });
          
          const result = await Promise.race([
            getRedirectResult(auth),
            timeoutPromise
          ]);
          
          if (result && result.user) {
            return result;
          }
          
          // Esperar um pouco antes de tentar novamente
          if (i < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.warn(`Erro na tentativa ${i + 1}:`, error);
          if (i === retries) throw error;
          // Esperar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return null;
    };
    
    // Executar com retry
    const result = await getRedirectResultWithRetry().catch(error => {
      console.warn('Todas as tentativas falharam:', error);
      return null;
    });
    
    // Verificar se temos um usuário atual mesmo sem resultado de redirecionamento
    if (!result || !result.user) {
      console.log('Verificando usuário atual...');
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('Usuário atual encontrado:', currentUser.displayName);
        try {
          // Atualizar token
          const token = await currentUser.getIdToken(true);
          storeAuthToken(token);
          
          // Armazenar informações básicas do usuário
          const userInfo = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          };
          try {
            localStorage.setItem('auth_user', JSON.stringify(userInfo));
            sessionStorage.setItem('auth_user', JSON.stringify(userInfo));
          } catch (e) {}
          
          return { success: true, user: currentUser };
        } catch (e) {
          console.error('Erro ao processar usuário atual:', e);
        }
      }
    }
    
    if (result && result.user) {
      console.log('Redirecionamento bem-sucedido, usuário autenticado:', result.user.displayName);
      
      // Salvar token de autenticação
      try {
        const token = await result.user.getIdToken();
        storeAuthToken(token);
        
        // Armazenar informações básicas do usuário para acesso rápido
        try {
          const userInfo = {
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoURL
          };
          localStorage.setItem('auth_user', JSON.stringify(userInfo));
          sessionStorage.setItem('auth_user', JSON.stringify(userInfo));
          
          // Usar cookies como fallback
          document.cookie = `auth_user=${encodeURIComponent(JSON.stringify(userInfo))}; path=/; SameSite=Strict; max-age=86400`;
        } catch (e) {
          console.warn('Não foi possível armazenar informações do usuário:', e);
        }
        
        // Forçar atualização do estado de autenticação
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('Forçando atualização do estado de autenticação');
          // Disparar evento de mudança de estado
          auth.updateCurrentUser(currentUser);
        }
      } catch (e) {
        console.error('Erro ao salvar token:', e);
      }
      
      return { success: true, user: result.user };
    } else {
      console.log('Nenhum resultado de redirecionamento ou usuário não autenticado');
      
      // Verificar se temos um usuário atual mesmo sem resultado de redirecionamento
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('Usuário atual encontrado:', currentUser.displayName);
        return { success: true, user: currentUser };
      }
      
      return { success: false };
    }
    
    // Verificar se já temos um token armazenado
    const token = getAuthToken();
    if (token && auth.currentUser) {
      return { success: true, user: auth.currentUser };
    }
    
    // Se não há resultado mas também não há erro, pode ser que não estamos
    // retornando de um redirecionamento
    return { success: true };
  } catch (error) {
    console.error('Erro ao verificar resultado do redirecionamento:', error);
    
    // Verificar se o erro está relacionado à proteção contra rastreamento
    if (error.code === 'auth/web-storage-unsupported' ||
        error.code === 'auth/network-request-failed' ||
        error.code === 'auth/cookies-blocked' ||
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.message?.includes('Tracking Prevention') ||
        error.message?.includes('storage') ||
        error.message?.includes('cookie')) {
      console.warn('Detectada proteção contra rastreamento:', error);
      error.code = 'auth/tracking-prevention';
      error.message = 'Seu navegador está bloqueando cookies ou armazenamento local necessários para autenticação. Tente desativar a proteção contra rastreamento nas configurações do navegador ou use outro navegador como Chrome ou Edge.';
      
      // Tentar usar apenas cookies como fallback
      try {
        document.cookie = `auth_fallback=true; path=/; SameSite=Lax; max-age=60`;
      } catch (e) {}
    }
    
    return { success: false, error };
  }
};

// Verificar se o usuário está autenticado usando múltiplas fontes
export const getCurrentUser = () => {
  // 1. Verificar Firebase Auth diretamente
  if (auth.currentUser) {
    return auth.currentUser;
  }
  
  // 2. Verificar token armazenado
  const token = getAuthToken();
  if (token) {
    // Se temos um token mas não temos usuário, podemos tentar reautenticar
    // Isso será tratado pelo listener de estado de autenticação
    return { isTokenOnly: true, token };
  }
  
  return null;
};

// Observar mudanças no estado de autenticação
export const subscribeToAuthChanges = (callback) => {
  console.log('Configurando listener de autenticação...');
  
  // Verificar se já temos informações de usuário armazenadas
  const checkStoredUserInfo = () => {
    try {
      // Tentar obter informações do usuário do armazenamento
      const storedUserStr = localStorage.getItem('auth_user') || 
                           sessionStorage.getItem('auth_user');
      
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          console.log('Informações de usuário encontradas no armazenamento:', storedUser.displayName);
          return storedUser;
        } catch (e) {
          console.warn('Erro ao processar informações armazenadas do usuário:', e);
        }
      }
      
      // Verificar cookies como fallback
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_user') {
          try {
            const cookieUser = JSON.parse(decodeURIComponent(value));
            console.log('Informações de usuário encontradas em cookie:', cookieUser.displayName);
            return cookieUser;
          } catch (e) {}
        }
      }
    } catch (e) {}
    
    return null;
  };
  
  // Verificar imediatamente se temos um usuário armazenado
  const storedUser = checkStoredUserInfo();
  if (storedUser && !auth.currentUser) {
    console.log('Usuário encontrado no armazenamento, mas não no Firebase');
    // Notificar o callback com as informações armazenadas enquanto aguardamos a verificação do Firebase
    callback(storedUser);
  }
  
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // Quando o usuário é autenticado, armazenar o token
      user.getIdToken().then(token => {
        storeAuthToken(token);
        
        // Armazenar informações básicas do usuário
        try {
          const userInfo = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          };
          localStorage.setItem('auth_user', JSON.stringify(userInfo));
          sessionStorage.setItem('auth_user', JSON.stringify(userInfo));
          document.cookie = `auth_user=${encodeURIComponent(JSON.stringify(userInfo))}; path=/; SameSite=Strict; max-age=86400`;
        } catch (e) {}
      }).catch(err => {
        console.error('Erro ao obter token do usuário:', err);
      });
      console.log('Usuário autenticado:', user.displayName);
    } else {
      // Verificar se temos um token armazenado mesmo sem usuário
      const token = getAuthToken();
      if (token) {
        console.log('Token encontrado, mas usuário não está autenticado no Firebase');
        // Verificar se temos informações armazenadas do usuário
        const storedUser = checkStoredUserInfo();
        if (storedUser) {
          console.log('Usando informações armazenadas do usuário:', storedUser.displayName);
          // Notificar com as informações armazenadas
          callback(storedUser);
          return;
        }
      } else {
        console.log('Usuário não autenticado');
        clearAuthToken();
      }
    }
    
    callback(user);
  });
};

// Função para logout
export const signOutUser = async () => {
  try {
    await signOut(auth);
    clearAuthToken();
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { success: false, error };
  }
};
