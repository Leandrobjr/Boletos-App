import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGoogle, FaLock, FaEnvelope, FaExclamationTriangle, FaUser, FaIdCard, FaPhone } from 'react-icons/fa';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [googleUserData, setGoogleUserData] = useState({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    endereco: ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulação de login bem-sucedido
    onLogin();
    // Redirecionamento seria feito pelo Router
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-greenPrimary bitcoin-font">BoletoXCrypto</h1>
          <p className="text-grayMedium mt-2">Acesse sua conta para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input pl-10"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-10"
                placeholder="********"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Lembrar-me
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="text-primary hover:underline">
                Esqueceu a senha?
              </a>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="btn-primary w-full flex justify-center"
            >
              <FaLock className="mr-2" /> Acessar com senha
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowGoogleForm(true)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaGoogle className="mr-2 text-red-500" /> Acessar com Google
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-primary font-medium hover:underline">
              Cadastre-se agora
            </Link>
          </p>
        </div>
      </div>
      
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
              // Simular login bem-sucedido após preenchimento do formulário
              onLogin();
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
                  <input
                    id="nome"
                    type="text"
                    value={googleUserData.nome}
                    onChange={(e) => setGoogleUserData({...googleUserData, nome: e.target.value})}
                    className="form-input pl-10"
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
                  <input
                    id="cpfCnpj"
                    type="text"
                    value={googleUserData.cpfCnpj}
                    onChange={(e) => setGoogleUserData({...googleUserData, cpfCnpj: e.target.value})}
                    className="form-input pl-10"
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
                  <input
                    id="telefone"
                    type="tel"
                    value={googleUserData.telefone}
                    onChange={(e) => setGoogleUserData({...googleUserData, telefone: e.target.value})}
                    className="form-input pl-10"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>
              
              {/* Endereço */}
              <div>
                <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <textarea
                  id="endereco"
                  value={googleUserData.endereco}
                  onChange={(e) => setGoogleUserData({...googleUserData, endereco: e.target.value})}
                  className="form-input"
                  placeholder="Seu endereço completo"
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="btn-primary w-full flex justify-center"
                >
                  Finalizar cadastro e acessar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
