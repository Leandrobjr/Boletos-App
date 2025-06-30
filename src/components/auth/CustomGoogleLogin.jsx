import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Typography, Box, Alert } from '@mui/material';
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } from 'firebase/auth';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';

const CustomGoogleLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Login com Google
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // Configurações para melhor compatibilidade
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Configurar persistência de sessão
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (persistenceError) {
        console.warn('Não foi possível configurar persistência:', persistenceError);
      }
      
      // Iniciar o processo de login com popup
      const result = await signInWithPopup(auth, provider);
      
      if (result && result.user) {
        navigate('/');
      }
      
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      if (error.code === 'auth/popup-blocked') {
        setError('O popup foi bloqueado. Por favor, permita popups para este site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada. Tente novamente.');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
      
      setLoading(false);
    }
  };

  // Verificar se o usuário já está logado ao carregar
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // Usuário já está autenticado, redirecionar
        navigate('/');
      }
      setLoading(false);
    });
    
    // Cleanup da inscrição
    return () => unsubscribe();
  }, [navigate]);

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button 
        id="google-login-button"
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
        Entrar com Google
      </Button>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CustomGoogleLogin;
