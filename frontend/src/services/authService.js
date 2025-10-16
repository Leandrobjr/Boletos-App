// authService.js - Serviço centralizado para autenticação
import { 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { auth, provider } from "./firebaseConfig";

// Configurar persistência local para funcionar mesmo com proteção contra rastreamento
const configurePersistence = async () => {
  try {
    // Tentar usar persistência local primeiro
    await setPersistence(auth, browserLocalPersistence);
    console.log('Persistência local configurada com sucesso');
  } catch (error) {
    console.warn('Não foi possível usar persistência local, tentando sessão:', error);
    try {
      // Fallback para persistência de sessão
      await setPersistence(auth, browserSessionPersistence);
      console.log('Persistência de sessão configurada com sucesso');
    } catch (innerError) {
      console.error('Falha ao configurar persistência:', innerError);
    }
  }
};

// Configurar persistência ao inicializar o serviço
configurePersistence();

// Função para iniciar login com Google via redirecionamento
export const loginWithGoogle = async () => {
  try {
    // Garantir que a persistência está configurada antes de tentar login
    await configurePersistence();
    
    // Armazenar estado de autenticação pendente em localStorage
    // Isso é importante para detectar quando o usuário retorna do redirecionamento
    localStorage.setItem('auth_pending', Date.now().toString());
    sessionStorage.setItem('auth_pending', 'true');
    
    // Adicionar um parâmetro de timestamp para evitar cache
    provider.setCustomParameters({
      prompt: 'select_account',
      // Adicionar timestamp para evitar cache
      login_hint: `${Date.now()}`,
    });
    
    console.log('Iniciando redirecionamento para autenticação Google...');
    
    // Iniciar processo de login com redirecionamento
    await signInWithRedirect(auth, provider);
    
    // O código abaixo não será executado até que o usuário retorne do redirecionamento
    return { success: true };
  } catch (error) {
    console.error('Erro ao iniciar autenticação:', error.code, error.message);
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Função para verificar resultado do redirecionamento
export const checkRedirectResult = async () => {
  try {
    console.log('Verificando resultado de redirecionamento...');
    
    // Verificar se há resultado de redirecionamento pendente
    const result = await getRedirectResult(auth);
    
    // Limpar flags de autenticação pendente
    localStorage.removeItem('auth_pending');
    sessionStorage.removeItem('auth_pending');
    
    if (result && result.user) {
      console.log('Login por redirecionamento bem-sucedido:', result.user.displayName);
      return { 
        success: true, 
        user: result.user 
      };
    } else {
      // Verificar se o usuário já está autenticado
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('Usuário já está autenticado:', currentUser.displayName);
        return {
          success: true,
          user: currentUser
        };
      }
      
      // Verificar se estamos retornando de um redirecionamento
      const pendingAuth = localStorage.getItem('auth_pending');
      if (pendingAuth) {
        console.log('Detectado retorno de redirecionamento, mas sem resultado. Possível problema de cookies.');
        return {
          success: false,
          error: {
            code: 'auth/redirect-no-result',
            message: 'Redirecionamento detectado, mas sem resultado. Verifique se cookies estão habilitados.'
          }
        };
      }
      
      console.log('Nenhum resultado de redirecionamento encontrado');
      return { success: true, user: null };
    }
  } catch (error) {
    console.error('Erro ao processar redirecionamento:', error.code, error.message);
    
    // Limpar flags de autenticação pendente
    localStorage.removeItem('auth_pending');
    sessionStorage.removeItem('auth_pending');
    
    // Ignorar erro de usuário nulo (ocorre quando não há redirecionamento pendente)
    if (error.code === 'auth/null-user') {
      return { success: true, user: null };
    }
    
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Função para observar mudanças no estado de autenticação
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('Usuário autenticado:', user.displayName);
      // Limpar flags de autenticação pendente quando o usuário é detectado
      localStorage.removeItem('auth_pending');
      sessionStorage.removeItem('auth_pending');
    } else {
      console.log('Usuário não autenticado');
    }
    
    // Chamar callback com o usuário atual
    callback(user);
  });
};

// Função para fazer logout
export const logout = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Função para obter usuário atual
export const getCurrentUser = () => {
  return auth.currentUser;
};
