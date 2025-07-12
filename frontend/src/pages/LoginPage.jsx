import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaLock } from 'react-icons/fa';
import { useAuth } from '../components/auth/AuthProvider';

function LoginPage() {
  const { login, isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleError, setGoogleError] = useState(null);

  // Redirecionamento pós-login
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.displayName || !user.phoneNumber) {
        navigate('/alterar-cadastro');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleGoogleLogin = async () => {
    setGoogleError(null);
    console.log('[DEBUG] Clique no botão Google Login');
    try {
      await login();
      console.log('[DEBUG] Login Google disparado com sucesso');
    } catch (error) {
      console.error('[DEBUG] Erro ao fazer login com Google:', error);
      setGoogleError('Erro ao fazer login com Google.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard'); // Redireciona para o dashboard após o login
    } catch (error) {
      setGoogleError('E-mail ou senha inválidos.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-lime-100">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-green-200 overflow-hidden mx-auto flex flex-col" style={{margin: '0 auto'}}>
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">BoletoXCrypto</h1>
          <p className="text-green-100 text-sm">Acesse sua conta para continuar</p>
        </div>
        <div className="pt-6 pb-8 flex flex-col">
          <form className="space-y-4 w-full px-8" onSubmit={handleSubmit}>
            <div className="w-full flex flex-col gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" className="w-full box-border px-4 py-3 border border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input type="password" className="w-full box-border px-4 py-3 border border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] mt-2">
                <FaLock className="inline mr-2" />Acessar com senha
              </button>
            </div>
          </form>
          <div className="my-4 text-center text-gray-500">Ou continue com</div>
          {googleError && <div className="text-red-600 text-sm text-center mb-2">{googleError}</div>}
          <button
            type="button"
            className="w-full max-w-[400px] flex items-center justify-center gap-3 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 mx-auto mb-2"
            style={{height: '48px', background: '#fff'}}
            onClick={handleGoogleLogin}
          >
            <FaGoogle className="text-lg" style={{color: '#EA4335'}} />
            <span style={{color: '#444', fontWeight: 500}}>Entrar com Google</span>
          </button>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/cadastro" className="text-primary font-medium hover:underline">
                Cadastre-se agora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
