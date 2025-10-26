/**
 * Otimizador de Autenticação - Resolve problemas de timeout
 * Criado para corrigir timeouts na verificação de redirecionamento
 */

import { auth } from '../config/firebaseConfig';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  getRedirectResult,
  signInWithRedirect
} from 'firebase/auth';

class AuthOptimizer {
  constructor() {
    this.provider = new GoogleAuthProvider();
    this.provider.addScope('email');
    this.provider.addScope('profile');
    
    // Configurações otimizadas
    this.maxRetries = 2; // Reduzido de 3 para 2
    this.timeoutDuration = 3000; // Reduzido de 5000ms para 3000ms
    this.fastCheckInterval = 500; // Check mais rápido
    
    this.isProcessing = false;
    this.authStateListeners = [];
  }

  /**
   * Verificação rápida de redirecionamento com timeout otimizado
   */
  async checkRedirectResultFast() {
    console.log('🚀 [AUTH-OPTIMIZER] Verificação rápida de redirecionamento...');
    
    try {
      // Promise com timeout mais curto
      const result = await Promise.race([
        getRedirectResult(auth),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout rápido')), this.timeoutDuration)
        )
      ]);
      
      if (result && result.user) {
        console.log('✅ [AUTH-OPTIMIZER] Redirecionamento bem-sucedido:', result.user.displayName);
        return result;
      }
      
      return null;
    } catch (error) {
      if (error.message === 'Timeout rápido') {
        console.log('⏱️ [AUTH-OPTIMIZER] Timeout na verificação - continuando...');
        return null;
      }
      
      console.warn('⚠️ [AUTH-OPTIMIZER] Erro na verificação:', error.message);
      return null;
    }
  }

  /**
   * Login otimizado com fallback inteligente
   */
  async loginWithGoogle() {
    if (this.isProcessing) {
      console.log('🔄 [AUTH-OPTIMIZER] Login já em andamento...');
      return null;
    }

    this.isProcessing = true;
    console.log('🔑 [AUTH-OPTIMIZER] Iniciando login otimizado...');

    try {
      // Primeiro tenta popup (mais rápido)
      console.log('🪟 [AUTH-OPTIMIZER] Tentando login com popup...');
      const result = await signInWithPopup(auth, this.provider);
      
      if (result && result.user) {
        console.log('✅ [AUTH-OPTIMIZER] Login com popup bem-sucedido:', result.user.displayName);
        this.isProcessing = false;
        return result;
      }
    } catch (popupError) {
      console.log('⚠️ [AUTH-OPTIMIZER] Popup falhou, tentando redirecionamento...', popupError.message);
      
      try {
        // Fallback para redirecionamento
        await signInWithRedirect(auth, this.provider);
        console.log('🔄 [AUTH-OPTIMIZER] Redirecionamento iniciado...');
        this.isProcessing = false;
        return 'redirect_initiated';
      } catch (redirectError) {
        console.error('❌ [AUTH-OPTIMIZER] Ambos os métodos falharam:', redirectError);
        this.isProcessing = false;
        throw redirectError;
      }
    }

    this.isProcessing = false;
    return null;
  }

  /**
   * Configuração de listener otimizado
   */
  setupOptimizedAuthListener(callback) {
    console.log('👂 [AUTH-OPTIMIZER] Configurando listener otimizado...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 [AUTH-OPTIMIZER] Estado de autenticação alterado:', user ? user.displayName : 'Deslogado');
      
      // Sincroniza com localStorage de forma otimizada
      if (user) {
        const userData = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          timestamp: Date.now()
        };
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('auth_state', 'authenticated');
      } else {
        localStorage.removeItem('user_data');
        localStorage.setItem('auth_state', 'unauthenticated');
      }
      
      callback(user);
    });

    this.authStateListeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Verificação inteligente de estado
   */
  async smartStateCheck() {
    console.log('🧠 [AUTH-OPTIMIZER] Verificação inteligente de estado...');
    
    // Verifica localStorage primeiro (mais rápido)
    const localAuthState = localStorage.getItem('auth_state');
    const localUserData = localStorage.getItem('user_data');
    
    if (localAuthState === 'authenticated' && localUserData) {
      try {
        const userData = JSON.parse(localUserData);
        const timeDiff = Date.now() - (userData.timestamp || 0);
        
        // Se os dados são recentes (menos de 1 hora), confia neles
        if (timeDiff < 3600000) {
          console.log('⚡ [AUTH-OPTIMIZER] Usando dados locais recentes:', userData.displayName);
          return userData;
        }
      } catch (error) {
        console.warn('⚠️ [AUTH-OPTIMIZER] Erro ao parsear dados locais:', error);
      }
    }
    
    // Verifica Firebase como fallback
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('✅ [AUTH-OPTIMIZER] Usuário Firebase encontrado:', currentUser.displayName);
      return currentUser;
    }
    
    console.log('❌ [AUTH-OPTIMIZER] Nenhum usuário encontrado');
    return null;
  }

  /**
   * Limpeza de recursos
   */
  cleanup() {
    console.log('🧹 [AUTH-OPTIMIZER] Limpando recursos...');
    this.authStateListeners.forEach(unsubscribe => unsubscribe());
    this.authStateListeners = [];
    this.isProcessing = false;
  }

  /**
   * Reset completo do estado de autenticação
   */
  resetAuthState() {
    console.log('🔄 [AUTH-OPTIMIZER] Resetando estado de autenticação...');
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_state');
    this.isProcessing = false;
  }
}

// Instância singleton
export const authOptimizer = new AuthOptimizer();
export default authOptimizer;