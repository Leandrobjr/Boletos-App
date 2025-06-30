import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Typography, Box, Alert, Link } from '@mui/material';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';

const GoogleLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // Verificar status de autenticação ao carregar o componente
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        navigate('/');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // Configuração mínima para evitar problemas
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Usar popup com configurações mínimas
      await signInWithPopup(auth, provider);
      
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Mensagens de erro amigáveis e simplificadas
      if (error.code === 'auth/popup-blocked') {
        setError('O popup de login foi bloqueado. Clique novamente e permita popups para este site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada. Tente novamente.');
      } else if (error.message?.includes('Tracking Prevention') || error.message?.includes('blocked') || error.message?.includes('storage')) {
        setError('Seu navegador está bloqueando recursos necessários. Tente usar Chrome ou Edge.');
      } else if (error.message?.includes('Cross-Origin')) {
        setError('Problema de compatibilidade detectado. Tente usar Chrome ou Edge.');
      } else {
        setError(`Erro ao fazer login. Tente novamente ou use outro navegador.`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {error?.includes('Chrome') && (
            <Box sx={{ mt: 1 }}>
              <Link href="https://support.google.com/accounts/answer/6010255" target="_blank" rel="noopener">
                Como resolver problemas de login com Google
              </Link>
            </Box>
          )}
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
        {loading ? 'Entrando...' : 'Entrar com Google'}
      </Button>
      
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
        Recomendamos usar Chrome ou Edge para melhor compatibilidade
      </Typography>
    </Box>
  );
};

export default GoogleLoginButton;
