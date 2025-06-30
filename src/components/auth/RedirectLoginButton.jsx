import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Typography, Box, Alert } from '@mui/material';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, setPersistence, browserSessionPersistence } from 'firebase/auth';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';

const RedirectLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const navigate = useNavigate();

  // Verificar resultado do redirecionamento ao carregar
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        
        // Verificar se há cookie de redirecionamento
        const hasRedirectCookie = document.cookie.includes('auth_redirect=true');
        
        // Limpar cookie de redirecionamento
        document.cookie = 'auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
        
        console.log('Verificando resultado do redirecionamento...');
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('Login por redirecionamento bem-sucedido!', result.user.displayName);
          
          // Redirecionar para a página inicial
          navigate('/');
        } else if (hasRedirectCookie) {
          // Se temos o cookie mas não temos resultado, provavelmente houve um bloqueio
          console.warn('Redirecionamento detectado, mas sem resultado - possível bloqueio de tracking');
          setError('Seu navegador pode estar bloqueando cookies de autenticação. Tente desativar a proteção contra rastreamento ou use outro navegador.');
        }
      } catch (error) {
        console.error('Erro ao processar resultado do redirecionamento:', error);
        if (error.code === 'auth/credential-already-in-use') {
          setError('Esta conta já está sendo usada. Tente fazer login diretamente.');
        } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
          setError('O popup foi bloqueado ou fechado. Tente novamente.');
        } else if (error.message && error.message.includes('storage')) {
          setError('Seu navegador está bloqueando o acesso ao armazenamento. Desative a proteção contra rastreamento ou use outro navegador.');
        } else {
          setError(`Erro ao processar login: ${error.code || error.message}`);
        }
      } finally {
        setLoading(false);
        setCheckingRedirect(false);
      }
    };
    
    // Verificar resultado do redirecionamento
    checkRedirectResult();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // Tentar usar persistência de sessão para evitar problemas de tracking prevention
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.log('Persistência de sessão configurada com sucesso');
      } catch (persistenceError) {
        console.warn('Não foi possível configurar persistência:', persistenceError);
        // Continuar mesmo com erro de persistência
      }
      
      // Configuração mínima
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Usar cookies em vez de localStorage para compatibilidade com políticas de privacidade
      try {
        document.cookie = `auth_redirect=true; path=/; max-age=300; SameSite=Strict`;
      } catch (cookieError) {
        console.warn('Não foi possível configurar cookie:', cookieError);
      }
      
      // Usar apenas redirecionamento (sem popup)
      await signInWithRedirect(auth, provider);
      
      // Esta linha só será executada se o redirecionamento falhar
      console.log('Redirecionamento não ocorreu como esperado');
      
    } catch (error) {
      console.error('Erro ao iniciar login:', error);
      setError(`Erro ao iniciar login: ${error.code || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (checkingRedirect) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
        onClick={handleGoogleLogin}
        disabled={loading}
        fullWidth
        sx={{
          backgroundColor: '#4285F4',
          '&:hover': {
            backgroundColor: '#357ae8',
          },
          py: 1.2
        }}
      >
        {loading ? 'Redirecionando...' : 'Entrar com Google (Redirecionamento)'}
      </Button>
      
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
        Método alternativo sem popup
      </Typography>
      
      {error && (
        <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
          <Typography variant="caption">
            Dica: Se estiver usando Safari ou navegador com proteção contra rastreamento ativada, tente:
            <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
              <li>Desativar temporariamente a proteção contra rastreamento</li>
              <li>Permitir cookies de terceiros para este site</li>
              <li>Usar o Chrome ou Edge para fazer login</li>
            </ul>
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default RedirectLoginButton;
