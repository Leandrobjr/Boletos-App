import React, { useState, useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';

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
    console.log('Botão GoogleLoginButton clicado');
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        navigate('/');
      }
    } catch (error) {
      setError('Erro ao fazer login com Google.');
      setLoading(false);
    }
  };
  
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

export default GoogleLoginButton;
