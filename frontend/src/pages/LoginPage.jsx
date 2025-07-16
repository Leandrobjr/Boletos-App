import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaLock, FaEnvelope, FaExclamationTriangle, FaUser, FaIdCard, FaPhone } from 'react-icons/fa';
import { useAuth } from '../components/auth/AuthProvider';
import LoginButton from '../components/auth/LoginButton';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import Button from '../components/ui/Button';

function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [googleUserData, setGoogleUserData] = useState({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    endereco: ''
  });
  
  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Aqui você implementaria a lógica de login com email/senha
      console.log('Login com email/senha:', { email, password });
      // Por enquanto, vamos usar o login do Google
      await login();
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Erro no login com Google:', error);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 bg-muted min-h-screen">
      <Card className="mx-auto w-full p-0" style={{maxWidth: '400px', minWidth: 280, minHeight: '600px'}}>
        <CardHeader className="text-center">
          <CardTitle className="text-greenPrimary bitcoin-font text-3xl md:text-4xl">BoletoXCrypto</CardTitle>
          <p className="text-grayMedium mt-2 text-lg md:text-xl">Acesse sua conta para continuar</p>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col items-center">
          <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md mx-auto">
            <div className="w-full flex justify-center">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="w-full max-w-[280px] text-lg py-3"
              />
            </div>
            <div className="w-full flex justify-center">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                autoComplete="current-password"
                className="w-full max-w-[280px] text-lg py-3"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Lembrar-me</label>
              </div>
              <div className="text-sm">
                <a href="#" className="text-primary hover:underline">Esqueceu a senha?</a>
              </div>
            </div>
            <div className="w-full flex justify-center">
              <Button type="submit" fullWidth variant="primary" disabled={loading} leftIcon={<FaLock className="mr-2 text-xl" />} className="w-full text-lg py-4 max-w-[280px]">{loading ? 'Conectando...' : 'Acessar com senha'}</Button>
            </div>
          </form>
          <div className="mt-6 flex flex-col gap-2 w-full flex justify-center items-center">
            <LoginButton fullWidth onClick={handleGoogleLogin} className="w-full text-lg py-4 max-w-[280px]" />
          </div>
          <div className="mt-6 text-center">
            <p className="text-base text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/cadastro" className="text-primary font-medium hover:underline text-lg">Cadastre-se agora</Link>
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Modal de cadastro completo para login via Google */}
      {showGoogleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowGoogleForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-greenDark">Complete seu cadastro</h2>
              <p className="text-grayMedium mt-2 flex items-center justify-center">
                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                É necessário completar seu cadastro para continuar
              </p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleGoogleLogin();
              setShowGoogleForm(false);
            }} className="space-y-4">
              {/* Nome completo */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <Input
                    id="nome"
                    type="text"
                    value={googleUserData.nome}
                    onChange={(e) => setGoogleUserData({...googleUserData, nome: e.target.value})}
                    className="pl-10"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>
              
              {/* CPF/CNPJ */}
              <div>
                <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700 mb-1">
                  CPF/CNPJ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaIdCard className="text-gray-400" />
                  </div>
                  <Input
                    id="cpfCnpj"
                    type="text"
                    value={googleUserData.cpfCnpj}
                    onChange={(e) => setGoogleUserData({...googleUserData, cpfCnpj: e.target.value})}
                    className="pl-10"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    required
                  />
                </div>
              </div>
              
              {/* Telefone */}
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <Input
                    id="telefone"
                    type="tel"
                    value={googleUserData.telefone}
                    onChange={(e) => setGoogleUserData({...googleUserData, telefone: e.target.value})}
                    className="pl-10"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>
              
              {/* Endereço */}
              <div>
                <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço completo
                </label>
                <textarea
                  id="endereco"
                  value={googleUserData.endereco}
                  onChange={(e) => setGoogleUserData({...googleUserData, endereco: e.target.value})}
                  className="form-input"
                  rows="3"
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGoogleForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Completando...' : 'Completar cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default LoginPage;
