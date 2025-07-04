import React, { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CustomGoogleLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Login com Google
  const handleGoogleLogin = async () => {
    console.log('Botão CustomGoogleLogin clicado');
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
  React.useEffect(() => {
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
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-2 w-full max-w-xs bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-100 transition"
        disabled={loading}
        type="button"
      >
        <FaGoogle className="text-lg" />
        {loading ? 'Entrando...' : 'Entrar com Google'}
      </button>
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
    </div>
  );
};

export default CustomGoogleLogin;
