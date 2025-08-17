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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-green-100 flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-lime-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-4 -left-4 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      {/* Modal central */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          {/* Header com gradiente */}
          <CardHeader className="bg-gradient-to-r from-green-800 to-lime-600 text-white text-center rounded-t-lg p-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-2xl text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold">BoletoXCrypto</CardTitle>
              <p className="text-green-100 mt-2 text-sm md:text-base">Acesse sua conta para continuar</p>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                  <FaEnvelope className="mr-2 text-green-600" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              {/* Campo Senha */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
                  <FaLock className="mr-2 text-green-600" />
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              {/* Lembrar-me e Esqueceu senha */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-gray-600">Lembrar-me</label>
                </div>
                <a href="#" className="text-green-600 hover:text-green-800 font-medium">
                  Esqueceu a senha?
                </a>
              </div>
              
              {/* Botão Login */}
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-green-800 to-lime-600 hover:from-green-900 hover:to-lime-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Conectando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FaLock className="mr-2" />
                    Acessar com senha
                  </div>
                )}
              </Button>
            </form>
            
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>
            
            {/* Botão Google */}
            <div className="space-y-4">
              <LoginButton 
                onClick={handleGoogleLogin} 
                className="w-full h-12 border-2 border-gray-300 hover:border-green-500 bg-white hover:bg-green-50 text-gray-700 hover:text-green-800 font-semibold rounded-lg transition-all duration-200"
              />
            </div>
            
            {/* Link Cadastro */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  to="/cadastro" 
                  className="text-green-600 hover:text-green-800 font-semibold hover:underline transition-colors"
                >
                  Cadastre-se agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
      {/* Modal de cadastro completo para login via Google */}
      {showGoogleForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white">
            {/* Header do modal */}
            <CardHeader className="bg-gradient-to-r from-green-800 to-lime-600 text-white rounded-t-lg relative">
              <button 
                onClick={() => setShowGoogleForm(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ×
              </button>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaUser className="text-xl text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Complete seu cadastro</CardTitle>
                <p className="text-green-100 mt-2 text-sm flex items-center justify-center">
                  <FaExclamationTriangle className="text-yellow-300 mr-2" />
                  É necessário completar seu cadastro para continuar
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleGoogleLogin();
                setShowGoogleForm(false);
              }} className="space-y-4">
                {/* Nome completo */}
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm font-medium text-gray-700 flex items-center">
                    <FaUser className="mr-2 text-green-600" />
                    Nome completo
                  </label>
                  <Input
                    id="nome"
                    type="text"
                    value={googleUserData.nome}
                    onChange={(e) => setGoogleUserData({...googleUserData, nome: e.target.value})}
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                
                {/* CPF/CNPJ */}
                <div className="space-y-2">
                  <label htmlFor="cpfCnpj" className="text-sm font-medium text-gray-700 flex items-center">
                    <FaIdCard className="mr-2 text-green-600" />
                    CPF/CNPJ
                  </label>
                  <Input
                    id="cpfCnpj"
                    type="text"
                    value={googleUserData.cpfCnpj}
                    onChange={(e) => setGoogleUserData({...googleUserData, cpfCnpj: e.target.value})}
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    required
                  />
                </div>
                
                {/* Telefone */}
                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm font-medium text-gray-700 flex items-center">
                    <FaPhone className="mr-2 text-green-600" />
                    Telefone
                  </label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={googleUserData.telefone}
                    onChange={(e) => setGoogleUserData({...googleUserData, telefone: e.target.value})}
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                
                {/* Endereço */}
                <div className="space-y-2">
                  <label htmlFor="endereco" className="text-sm font-medium text-gray-700">
                    Endereço completo
                  </label>
                  <textarea
                    id="endereco"
                    value={googleUserData.endereco}
                    onChange={(e) => setGoogleUserData({...googleUserData, endereco: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-500 focus:ring-green-500 resize-none"
                    rows="3"
                    placeholder="Rua, número, bairro, cidade, estado, CEP"
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGoogleForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-800 to-lime-600 hover:from-green-900 hover:to-lime-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completando...
                      </div>
                    ) : (
                      'Completar cadastro'
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

export default LoginPage;
