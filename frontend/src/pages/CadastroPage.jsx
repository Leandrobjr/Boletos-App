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
      <main 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'linear-gradient(to bottom right, #f0fdf4, #ecfdf5, #f0fdf4)'
        }}
      >
        <div 
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #bbf7d0',
            overflow: 'hidden',
            margin: '0 auto'
          }}
        >
          {/* Header */}
          <div 
            style={{
              background: 'linear-gradient(to right, #16a34a, #15803d)',
              padding: '1.5rem 2rem',
              textAlign: 'center'
            }}
          >
            <h1 
              style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '0.25rem'
              }}
            >
              Criar Conta
            </h1>
            <p 
              style={{
                color: '#dcfce7',
                fontSize: '0.875rem'
              }}
            >
              Preencha os dados para se cadastrar
            </p>
          </div>

          {/* Form */}
          <div 
            style={{
              padding: '1.5rem 2rem 2rem 2rem',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <form 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                width: '100%'
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  width: '100%'
                }}
              >
                {/* Nome Completo */}
                <div style={{ width: '100%' }}>
                  <label 
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>

                {/* Email */}
                <div style={{ width: '100%' }}>
                  <label 
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    E-mail
                  </label>
                  <input
                    type="email"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {/* Telefone */}
                <div style={{ width: '100%' }}>
                  <label 
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Telefone Celular
                  </label>
                  <input
                    type="tel"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                {/* Senha */}
                <div style={{ width: '100%' }}>
                  <label 
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Senha
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: '3rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div style={{ width: '100%' }}>
                  <label 
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Confirmar Senha
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: '3rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Confirme sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Checkbox */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    paddingTop: '0.5rem'
                  }}
                >
                  <input
                    type="checkbox"
                    id="terms"
                    style={{
                      marginTop: '0.25rem',
                      height: '1rem',
                      width: '1rem',
                      color: '#16a34a',
                      borderColor: '#d1d5db',
                      borderRadius: '0.25rem'
                    }}
                    className="focus:ring-green-500"
                    required
                  />
                  <label 
                    htmlFor="terms" 
                    style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}
                  >
                    Concordo com os{' '}
                    <a href="#" 
                      style={{
                        color: '#16a34a',
                        textDecoration: 'underline',
                        fontWeight: '500'
                      }}
                      className="hover:text-green-700"
                    >
                      Termos de Serviço
                    </a>{' '}
                    e{' '}
                    <a href="#" 
                      style={{
                        color: '#16a34a',
                        textDecoration: 'underline',
                        fontWeight: '500'
                      }}
                      className="hover:text-green-700"
                    >
                      Política de Privacidade
                    </a>
                  </label>
                </div>

                {/* Botão Criar Conta */}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(to right, #16a34a, #15803d)',
                    color: '#ffffff',
                    fontWeight: '600',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    marginTop: '0.5rem'
                  }}
                  className="hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-[1.02]"
                >
                  Criar Conta
                </button>
              </div>
            </form>

            {/* Divisor */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.5rem 0'
              }}
            >
              <div style={{ flex: 1, borderTop: '1px solid #d1d5db' }}></div>
              <span 
                style={{
                  padding: '0 1rem',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  backgroundColor: '#ffffff'
                }}
              >
                ou
              </span>
              <div style={{ flex: 1, borderTop: '1px solid #d1d5db' }}></div>
            </div>

            {/* Botão Google */}
            {googleError && (
              <div 
                style={{
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}
              >
                {googleError}
              </div>
            )}
            <button
              type="button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                border: '1px solid #d1d5db',
                color: '#374151',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              className="hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <span>Entrar com Google</span>
            </button>

            {/* Link Login */}
            <div 
              style={{
                textAlign: 'center',
                marginTop: '1.5rem'
              }}
            >
              <span style={{ color: '#6b7280' }}>Já tem cadastro?</span>{' '}
              <Link
                to="/login"
                style={{
                  color: '#15803d',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
                className="hover:text-green-900"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CadastroPage;