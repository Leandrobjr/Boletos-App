import React, { useState, useEffect, useCallback } from 'react';
import { FaGoogle } from 'react-icons/fa';
import Button from '../ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useAuth } from './AuthProvider';

/**
 * Botão de login simplificado e robusto que funciona em todos os navegadores
 */
const LoginButton = ({ variant = "contained", size = "medium", fullWidth = false }) => {
  const { login, loading, error } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showConsoleWarning, setShowConsoleWarning] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Verificar se o erro está relacionado à proteção contra rastreamento
  const isTrackingPreventionError = localError && 
    ((typeof localError === 'string' && 
     (localError.includes('rastreamento') || 
      localError.includes('cookies') || 
      localError.includes('armazenamento') ||
      localError.includes('Tracking Prevention'))) ||
    (localError?.code === 'auth/tracking-prevention'));

  // Detectar se estamos em um navegador com proteção contra rastreamento
  const [trackingProtectionActive, setTrackingProtectionActive] = useState(false);
  
  // Verificar proteção contra rastreamento ao carregar o componente
  useEffect(() => {
    const checkTrackingProtection = () => {
      try {
        localStorage.setItem('_test_storage', '1');
        localStorage.removeItem('_test_storage');
        return false;
      } catch (e) {
        console.warn('Proteção contra rastreamento detectada no LoginButton:', e);
        return true;
      }
    };
    
    const isProtectionActive = checkTrackingProtection();
    setTrackingProtectionActive(isProtectionActive);
    
    // Limpar mensagens de erro anteriores ao carregar
    setLocalError(null);
    
    // Verificar se há erros de console relacionados ao Google Sign-In
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Google') || 
          errorMessage.includes('auth') || 
          errorMessage.includes('firebase') ||
          errorMessage.includes('tracking')) {
        setShowConsoleWarning(true);
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Função para lidar com erros de autenticação
  const handleAuthError = useCallback((err) => {
    console.error('Erro ao fazer login:', err);
    
    // Incrementar contador de tentativas
    setLoginAttempts(prev => prev + 1);
    
    // Verificar se o erro está relacionado à proteção contra rastreamento
    if (err?.code === 'auth/tracking-prevention' || 
        (typeof err?.message === 'string' && 
         (err.message.includes('Tracking Prevention') || 
          err.message.includes('storage') || 
          err.message.includes('cookie')))) {
      setLocalError('Proteção contra rastreamento detectada. Por favor, verifique as configurações do seu navegador.');
      setTrackingProtectionActive(true);
    } else if (err?.code === 'auth/popup-closed-by-user') {
      setLocalError('Janela de login foi fechada. Tente novamente.');
    } else if (err?.code === 'auth/cancelled-popup-request') {
      // Ignorar este erro, é normal quando múltiplos popups são abertos
      setLocalError(null);
    } else if (err?.code === 'auth/network-request-failed') {
      setLocalError('Erro de conexão. Verifique sua internet e tente novamente.');
    } else if (err?.code === 'auth/timeout') {
      setLocalError('Tempo esgotado. Tente novamente.');
    } else if (err?.code === 'auth/web-storage-unsupported') {
      setLocalError('Seu navegador não suporta armazenamento web necessário para login.');
      setTrackingProtectionActive(true);
    } else {
      setLocalError(`Erro ao fazer login: ${err?.message || err?.code || 'erro desconhecido'}`);
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      
      // Se detectamos proteção contra rastreamento, mostrar aviso antes de prosseguir
      if (trackingProtectionActive) {
        console.log('Tentando login com proteção contra rastreamento ativa');
      }
      
      // Adicionar um pequeno atraso para evitar problemas de UI
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await login();
      
      if (!result?.success && result?.error) {
        handleAuthError(result.error);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Tentar novamente automaticamente se houver falhas relacionadas a timing
  useEffect(() => {
    if (localError && loginAttempts < 2 && 
        (localError.includes('tempo esgotado') || 
         localError.includes('conexão'))) {
      const timer = setTimeout(() => {
        console.log('Tentando login novamente automaticamente...');
        handleLogin();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [localError, loginAttempts]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '16px', 
      width: fullWidth ? '100%' : 'auto' 
    }}>
      {localError && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}
      
      {trackingProtectionActive && !localError && (
        <Alert>
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            Detectamos que seu navegador está com proteção contra rastreamento ativada. Isso pode causar problemas no login.
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        variant="primary"
        size="md"
        fullWidth={fullWidth}
        disabled={localLoading || loading}
        onClick={handleLogin}
        leftIcon={localLoading ? (
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #ffffff',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        ) : <FaGoogle />}
        style={{
          position: 'relative',
          overflow: 'hidden',
          ...(trackingProtectionActive && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,0,0.1)',
              pointerEvents: 'none'
            }
          })
        }}
      >
        {localLoading ? 'Conectando...' : 'Entrar com Google'}
      </Button>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginButton;

