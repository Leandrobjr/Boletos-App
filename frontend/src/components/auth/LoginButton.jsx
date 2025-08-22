import React, { useState, useEffect, useCallback } from 'react';
import { FaGoogle } from 'react-icons/fa';
import Button from '../ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useAuth } from './AuthProvider';

/**
 * Botão de login simplificado e robusto que funciona em todos os navegadores
 */
const LoginButton = ({ variant = "contained", size = "medium", fullWidth = false, className = "", onClick }) => {
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

  const handleClick = onClick || handleLogin;
  
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
    <div className="w-full">
      {localError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}
      
      {trackingProtectionActive && !localError && (
        <Alert className="mb-4">
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            Detectamos que seu navegador está com proteção contra rastreamento ativada. Isso pode causar problemas no login.
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        variant="secondary"
        size="md"
        fullWidth={true}
        disabled={localLoading || loading}
        onClick={handleClick}
        className={`w-full h-12 flex items-center justify-center space-x-3 px-4 py-3 text-base font-semibold rounded-lg transition-all duration-200 ${className}`}
        style={{
          backgroundColor: '#ffffff',
          color: '#374151',
          border: '1.5px solid #d1d5db',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
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
        {localLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
            <span>Conectando...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_993_771)">
                <path d="M19.805 10.23c0-.68-.06-1.36-.18-2.02H10v3.82h5.58c-.24 1.28-.97 2.36-2.07 3.08v2.56h3.34c1.96-1.81 3.09-4.48 3.09-7.44z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.97-.89 6.63-2.41l-3.34-2.56c-.93.62-2.12.99-3.29.99-2.53 0-4.68-1.71-5.44-4.01H1.09v2.62C2.82 17.98 6.13 20 10 20z" fill="#34A853"/>
                <path d="M4.56 11.99A5.98 5.98 0 014.22 10c0-.69.12-1.36.34-1.99V5.39H1.09A9.98 9.98 0 000 10c0 1.64.39 3.19 1.09 4.61l3.47-2.62z" fill="#FBBC05"/>
                <path d="M10 3.96c1.48 0 2.8.51 3.85 1.51l2.89-2.89C15.01.98 12.74 0 10 0 6.13 0 2.82 2.02 1.09 5.39l3.47 2.62C5.32 5.67 7.47 3.96 10 3.96z" fill="#EA4335"/>
              </g>
              <defs>
                <clipPath id="clip0_993_771">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <span>Entrar com Google</span>
          </>
        )}
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

