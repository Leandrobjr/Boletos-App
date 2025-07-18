import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { 
  signInWithGoogle, 
  checkRedirectResult, 
  subscribeToAuthChanges, 
  getCurrentUser, 
  signOutUser 
} from '../../services/tokenAuthManager';
import { useNavigate, useLocation } from 'react-router-dom';

// Criar contexto de autenticação
const AuthContext = createContext(null);

/**
 * Provedor de autenticação que gerencia o estado global de autenticação
 * e fornece métodos para login/logout em toda a aplicação
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [trackingPreventionDetected, setTrackingPreventionDetected] = useState(false);
  const [perfilVerificado, setPerfilVerificado] = useState(false);
  const [perfilCheckLoading, setPerfilCheckLoading] = useState(false);
  const [perfilCheckMessage, setPerfilCheckMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isChecking = useRef(false);

  // Inicialização da autenticação
  const initAuth = useCallback(async () => {
    try {
      console.log('Inicializando autenticação...');
      // Detectar se estamos em um navegador com proteção contra rastreamento
      let trackingProtectionActive = false;
      try {
        localStorage.setItem('_test_storage', '1');
        localStorage.removeItem('_test_storage');
      } catch (e) {
        console.warn('Proteção contra rastreamento detectada no AuthProvider:', e);
        trackingProtectionActive = true;
        setTrackingPreventionDetected(true);
      }
      // Verificar se já temos um usuário autenticado
      const currentUser = getCurrentUser();
      if (currentUser && !currentUser.isTokenOnly) {
        console.log('Usuário já autenticado:', currentUser.displayName);
        setUser(currentUser);
        setLoading(false);
      }
      // Verificar se estamos retornando de um redirecionamento
      console.log('Verificando resultado do redirecionamento...');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tempo esgotado ao verificar redirecionamento')), 8000);
      });
      const redirectResult = await Promise.race([
        checkRedirectResult(),
        timeoutPromise
      ]).catch(error => {
        console.warn('Erro ao verificar redirecionamento:', error);
        if (error.code === 'auth/tracking-prevention' || 
            error.message?.includes('Tracking Prevention') ||
            error.message?.includes('storage') ||
            error.message?.includes('cookie')) {
          setTrackingPreventionDetected(true);
        }
        return { success: false, error };
      });
      if (redirectResult.error) {
        console.error('Erro no resultado do redirecionamento:', redirectResult.error);
        setError(redirectResult.error);
        if (redirectResult.error.code === 'auth/tracking-prevention') {
          setTrackingPreventionDetected(true);
        }
      } else if (redirectResult.user) {
        console.log('Usuário autenticado após redirecionamento:', redirectResult.user.displayName);
        setUser(redirectResult.user);
      }
      // Configurar listener para mudanças no estado de autenticação
      const unsubscribe = subscribeToAuthChanges((authUser) => {
        console.log('Estado de autenticação alterado:', authUser ? `Usuário ${authUser.displayName}` : 'Deslogado');
        setUser(authUser);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      setError(error);
      setLoading(false);
      if (error.code === 'auth/tracking-prevention' || 
          (error.message && (
            error.message.includes('Tracking Prevention') ||
            error.message.includes('storage') ||
            error.message.includes('cookie')
          ))) {
        setTrackingPreventionDetected(true);
      }
    }
  }, []);

  // Executar inicialização
  useEffect(() => {
    if (initialized) return;
    const unsubscribe = initAuth();
    setInitialized(true);
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initialized, initAuth]);

  // Checagem de perfil robusta (sem loop)
  useEffect(() => {
    if (
      user &&
      !perfilVerificado &&
      !isChecking.current &&
      location.pathname !== '/alterar-cadastro'
    ) {
      isChecking.current = true;
      setPerfilCheckLoading(true);
      // Adiciona log para depuração
      const firebaseUid = user.uid;
      fetch(`http://localhost:3001/perfil/${firebaseUid}`)
        .then(res => res.json())
        .then(data => {
          const nomeValido = data && (data.nome || data.nome_completo);
          const telefoneValido = data && data.telefone;
          const emailValido = data && data.email;
          if (!nomeValido || !telefoneValido || !emailValido) {
            setPerfilCheckMessage('Seu cadastro está incompleto. Por favor, preencha todos os dados para continuar.');
            setTimeout(() => {
              setPerfilCheckMessage('');
              if (location.pathname !== '/alterar-cadastro') {
                navigate('/alterar-cadastro');
              }
            }, 2000);
          } else {
            setPerfilVerificado(true);
            if (location.pathname === '/alterar-cadastro') {
              navigate('/');
            }
          }
        })
        .catch(() => {
          setPerfilCheckMessage('Erro ao buscar seu perfil. Tente novamente.');
          setTimeout(() => {
            setPerfilCheckMessage('');
            if (location.pathname !== '/alterar-cadastro') {
              navigate('/alterar-cadastro');
            }
          }, 2000);
        })
        .finally(() => {
          setPerfilCheckLoading(false);
          isChecking.current = false;
        });
    }
    // Resetar verificação apenas se o usuário realmente mudou
    if (!user && perfilVerificado) setPerfilVerificado(false);
    if (!user) isChecking.current = false;
  }, [user, location.pathname, navigate, perfilVerificado]);

  // Função para login
  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Detectar se estamos em um navegador com proteção contra rastreamento
      let trackingProtectionActive = false;
      try {
        localStorage.setItem('_test_storage', '1');
        localStorage.removeItem('_test_storage');
      } catch (e) {
        console.warn('Proteção contra rastreamento detectada no login:', e);
        trackingProtectionActive = true;
      }
      
      // Se detectamos proteção contra rastreamento, mostrar aviso antes de prosseguir
      if (trackingProtectionActive) {
        console.log('Usando modo compatível para proteção contra rastreamento');
      }
      
      const result = await signInWithGoogle();
      
      if (!result.success && result.error) {
        throw result.error;
      }
      
      // O código abaixo não será executado até que o usuário retorne do redirecionamento
      return { success: true };
    } catch (err) {
      console.error('Erro no login:', err);
      
      // Verificar se o erro está relacionado à proteção contra rastreamento
      if (err.code === 'auth/tracking-prevention' || 
          (typeof err.message === 'string' && 
           (err.message.includes('Tracking Prevention') || 
            err.message.includes('storage') || 
            err.message.includes('cookie')))) {
        err.code = 'auth/tracking-prevention';
        err.message = 'Seu navegador está bloqueando cookies ou armazenamento local necessários para autenticação. Tente desativar a proteção contra rastreamento nas configurações do navegador ou use outro navegador como Chrome ou Edge.';
      }
      
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  };

  // Função para logout
  const logout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setUser(null);
      setPerfilVerificado(false);
      setLoading(false);
      navigate('/login');
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      error,
      perfilVerificado,
      perfilCheckLoading,
      perfilCheckMessage,
      trackingPreventionDetected,
      login: signInWithGoogle,
      logout: logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);