console.log("CadastroPage ATIVO")
import React, { useState } from 'react';
// import FooterBXC from '../components/FooterBXC';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const CadastroPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setGoogleError(null);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        navigate('/');
      }
    } catch (error) {
      setGoogleError('Erro ao fazer login com Google.');
    }
  };

  return (
    <>
      <main className="flex-1 flex items-center justify-center p-2 mt-2">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-green-200 overflow-hidden mx-auto flex flex-col" style={{margin: '0 auto'}}>
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Criar Conta</h1>
            <p className="text-green-100 text-sm">Preencha os dados para se cadastrar</p>
          </div>

          {/* Form */}
          <div className="pt-6 pb-8 flex flex-col">
            <form className="space-y-4 w-full px-8">
              <div className="w-full flex flex-col gap-4">
                {/* Nome Completo */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>

                {/* Email */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {/* Telefone */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone Celular
                  </label>
                  <input
                    type="tel"
                    className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                {/* Senha */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors pr-12"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-transparent border-none p-0 m-0 focus:outline-none"
                      style={{background: 'transparent', border: 'none', padding: 0, margin: 0}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#222" strokeWidth="2" style={{display: 'block'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors pr-12"
                      placeholder="Confirme sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-transparent border-none p-0 m-0 focus:outline-none"
                      style={{background: 'transparent', border: 'none', padding: 0, margin: 0}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#222" strokeWidth="2" style={{display: 'block'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-start space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Concordo com os{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 underline font-medium">
                      Termos de Serviço
                    </a>{' '}
                    e{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 underline font-medium">
                      Política de Privacidade
                    </a>
                  </label>
                </div>

                {/* Botão Criar Conta */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] mt-2"
                  style={{display: 'block', width: '100%'}}
                >
                  Criar Conta
                </button>
              </div>
            </form>

            {/* Divisor */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">ou</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Botão Google padrão Landpage */}
            {googleError && (
              <div className="text-red-600 text-sm text-center mb-2">{googleError}</div>
            )}
            <button
              type="button"
              className="w-full max-w-[400px] flex items-center justify-center gap-3 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 mx-auto mb-2"
              style={{height: '48px', background: '#fff'}}
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <span style={{color: '#444', fontWeight: 500}}>Entrar com Google</span>
            </button>

            {/* Link Login */}
            <div className="text-center mt-4">
              <span className="text-gray-600">Já tem cadastro?</span>{' '}
              <Link
                to="/login"
                className="text-green-700 hover:text-green-900 font-semibold underline cursor-pointer"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </main>
      <div style={{background:'#0ff',padding:4,textAlign:'center',fontWeight:900}}>RODAPÉ ATIVO</div>
    </>
  );
};

export default CadastroPage;