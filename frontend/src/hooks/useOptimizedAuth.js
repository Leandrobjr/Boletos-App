/**
 * Hook React Otimizado para Autenticação
 * Resolve problemas de timeout e inconsistências de estado
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../config/firebaseConfig';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  getRedirectResult,
  signOut
} from 'firebase/auth';

export const useOptimizedAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const provider = useRef(new GoogleAuthProvider());
  const isProcessing = useRef(false);
  const timeoutRef = useRef(null);

  // Configuração do provider
  useEffect(() => {
    provider.current.addScope('email');
    provider.current.addScope('profile');
  }, []);

  /**
   * Verificação rápida de redirecionamento sem timeout excessivo
   */
  const checkRedirectResultQuick = useCallback(async () => {
    console.log('🚀 [OPTIMIZED-AUTH] Verificação rápida de redirecionamento...');
    
    try {
      // Timeout mais curto para evitar travamento
      const result = await Promise.race([
        getRedirectResult(auth),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Quick timeout')), 2000)
        )
      ]);
      
      if (result?.user) {
        console.log('✅ [OPTIMIZED-AUTH] Redirecionamento bem-sucedido:', result.user.displayName);
        return result.user;
      }
      
      return null;
    } catch (error) {
      if (error.message === 'Quick timeout') {
        console.log('⏱️ [OPTIMIZED-AUTH] Timeout rápido - continuando normalmente');
        return null;
      }
      
      console.warn('⚠️ [OPTIMIZED-AUTH] Erro na verificação:', error.message);
      return null;
    }
  }, []);

  /**
   * Login otimizado com Google
   */
  const loginWithGoogle = useCallback(async () => {
    if (isProcessing.current) {
      console.log('🔄 [OPTIMIZED-AUTH] Login já em andamento...');
      return;
    }

    isProcessing.current = true;
    setError(null);
    setLoading(true);

    try {
      console.log('🔑 [OPTIMIZED-AUTH] Iniciando login...');
      
      const result = await signInWithPopup(auth, provider.current);
      
      if (result?.user) {
        console.log('✅ [OPTIMIZED-AUTH] Login bem-sucedido:', result.user.displayName);
        
        // Atualiza localStorage imediatamente
        const userData = {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          timestamp: Date.now()
        };
        
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('auth_state', 'authenticated');
        
        setUser(result.user);
        return result.user;
      }
    } catch (error) {
      console.error('❌ [OPTIMIZED-AUTH] Erro no login:', error);
      setError(error.message);
      
      // Limpa estado em caso de erro
      localStorage.removeItem('user_data');
      localStorage.setItem('auth_state', 'unauthenticated');
    } finally {
      isProcessing.current = false;
      setLoading(false);
    }
  }, []);

  /**
   * Logout otimizado
   */
  const logout = useCallback(async () => {
    try {
      console.log('🚪 [OPTIMIZED-AUTH] Fazendo logout...');
      
      await signOut(auth);
      
      // Limpa localStorage
      localStorage.removeItem('user_data');
      localStorage.setItem('auth_state', 'unauthenticated');
      
      setUser(null);
      setError(null);
      
      console.log('✅ [OPTIMIZED-AUTH] Logout bem-sucedido');
    } catch (error) {
      console.error('❌ [OPTIMIZED-AUTH] Erro no logout:', error);
      setError(error.message);
    }
  }, []);

  /**
   * Verificação inteligente de estado inicial
   */
  const checkInitialState = useCallback(async () => {
    console.log('🧠 [OPTIMIZED-AUTH] Verificação inteligente de estado...');
    
    // Primeiro verifica localStorage (mais rápido)
    const localAuthState = localStorage.getItem('auth_state');
    const localUserData = localStorage.getItem('user_data');
    
    if (localAuthState === 'authenticated' && localUserData) {
      try {
        const userData = JSON.parse(localUserData);
        const timeDiff = Date.now() - (userData.timestamp || 0);
        
        // Se os dados são recentes (menos de 30 minutos), usa eles
        if (timeDiff < 1800000) {
          console.log('⚡ [OPTIMIZED-AUTH] Usando dados locais recentes:', userData.displayName);
          
          // Cria um objeto user-like para compatibilidade
          const userLike = {
            uid: userData.uid,
            displayName: userData.displayName,
            email: userData.email,
            photoURL: userData.photoURL
          };
          
          setUser(userLike);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('⚠️ [OPTIMIZED-AUTH] Erro ao parsear dados locais:', error);
      }
    }
    
    // Verifica redirecionamento rapidamente
    const redirectUser = await checkRedirectResultQuick();
    if (redirectUser) {
      setUser(redirectUser);
      setLoading(false);
      return;
    }
    
    // Verifica usuário atual do Firebase
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('✅ [OPTIMIZED-AUTH] Usuário Firebase encontrado:', currentUser.displayName);
      setUser(currentUser);
    } else {
      console.log('❌ [OPTIMIZED-AUTH] Nenhum usuário encontrado');
      setUser(null);
    }
    
    setLoading(false);
  }, [checkRedirectResultQuick]);

  // Configuração do listener de autenticação
  useEffect(() => {
    console.log('👂 [OPTIMIZED-AUTH] Configurando listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔄 [OPTIMIZED-AUTH] Estado Firebase alterado:', firebaseUser ? firebaseUser.displayName : 'Deslogado');
      
      if (firebaseUser) {
        // Sincroniza com localStorage
        const userData = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          timestamp: Date.now()
        };
        
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('auth_state', 'authenticated');
        
        setUser(firebaseUser);
      } else {
        localStorage.removeItem('user_data');
        localStorage.setItem('auth_state', 'unauthenticated');
        
        setUser(null);
      }
      
      if (loading) {
        setLoading(false);
      }
    });

    // Verificação inicial
    checkInitialState();

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, checkInitialState]);

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user
  };
};

export default useOptimizedAuth;