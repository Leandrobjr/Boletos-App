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
    <div 
      className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-green-100"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorativo */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '-1rem',
            right: '-1rem',
            width: '18rem',
            height: '18rem',
            backgroundColor: '#d9f99d',
            borderRadius: '50%',
            opacity: 0.2,
            filter: 'blur(3rem)'
          }}
        ></div>
        <div 
          style={{
            position: 'absolute',
            bottom: '-1rem',
            left: '-1rem',
            width: '24rem',
            height: '24rem',
            backgroundColor: '#bbf7d0',
            borderRadius: '50%',
            opacity: 0.2,
            filter: 'blur(3rem)'
          }}
        ></div>
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16rem',
            height: '16rem',
            backgroundColor: '#86efac',
            borderRadius: '50%',
            opacity: 0.1,
            filter: 'blur(2rem)'
          }}
        ></div>
      </div>
      
      {/* Container principal centralizado */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '28rem',
          margin: '0 auto'
        }}
      >
        <Card 
          style={{
            border: 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden'
          }}
        >
          {/* Header com gradiente */}
          <CardHeader 
            style={{
              background: 'linear-gradient(to right, #166534, #15803d, #65a30d)',
              color: 'white',
              textAlign: 'center',
              padding: '2rem',
              paddingBottom: '1.5rem'
            }}
          >
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              {/* Ícone centralizado */}
              <div 
                style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <FaLock style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              
              {/* Título e subtítulo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <CardTitle 
                  style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.025em',
                    color: 'white',
                    margin: 0
                  }}
                >
                  BoletoXCrypto
                </CardTitle>
                <p 
                  style={{
                    color: '#dcfce7',
                    fontSize: '1rem',
                    fontWeight: '500',
                    margin: 0
                  }}
                >
                  Acesse sua conta para continuar
                </p>
              </div>
            </div>
          </CardHeader>
          
          {/* Conteúdo do formulário */}
          <CardContent 
            style={{
              padding: '2rem',
              paddingTop: '1.5rem'
            }}
          >
            {/* Formulário de login */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Campo Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label 
                  htmlFor="email" 
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FaEnvelope style={{ marginRight: '0.5rem', color: '#16a34a', fontSize: '1rem' }} />
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
                  style={{
                    height: '3rem',
                    borderColor: '#d1d5db',
                    fontSize: '1rem',
                    padding: '0 1rem'
                  }}
                  className="focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              {/* Campo Senha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label 
                  htmlFor="password" 
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FaLock style={{ marginRight: '0.5rem', color: '#16a34a', fontSize: '1rem' }} />
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
                  style={{
                    height: '3rem',
                    borderColor: '#d1d5db',
                    fontSize: '1rem',
                    padding: '0 1rem'
                  }}
                  className="focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              {/* Lembrar-me e Esqueceu senha */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    style={{
                      height: '1rem',
                      width: '1rem',
                      color: '#16a34a',
                      borderColor: '#d1d5db',
                      borderRadius: '0.25rem'
                    }}
                    className="focus:ring-green-500"
                  />
                  <label 
                    htmlFor="remember-me" 
                    style={{
                      marginLeft: '0.5rem',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}
                  >
                    Lembrar-me
                  </label>
                </div>
                <a 
                  href="#" 
                  style={{
                    color: '#16a34a',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                  className="hover:text-green-800 transition-colors duration-200"
                >
                  Esqueceu a senha?
                </a>
              </div>
              
              {/* Botão Login */}
              <Button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  height: '3rem',
                  background: 'linear-gradient(to right, #166534, #65a30d)',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                className="hover:from-green-900 hover:to-lime-700 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div 
                      style={{
                        animation: 'spin 1s linear infinite',
                        borderRadius: '50%',
                        height: '1.25rem',
                        width: '1.25rem',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        marginRight: '0.75rem'
                      }}
                    ></div>
                    Conectando...
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaLock style={{ marginRight: '0.75rem', fontSize: '1.125rem' }} />
                    Acessar com senha
                  </div>
                )}
              </Button>
            </form>
            
            {/* Divider */}
            <div style={{ position: 'relative', margin: '2rem 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid #d1d5db' }}></div>
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>
                <span 
                  style={{
                    padding: '0 1rem',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}
                >
                  ou
                </span>
              </div>
            </div>
            
            {/* Botão Google */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <LoginButton 
                onClick={handleGoogleLogin} 
                style={{
                  width: '100%',
                  height: '3rem',
                  border: '1.5px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                className="hover:border-green-500 hover:bg-green-50 hover:text-green-800"
              />
            </div>
            
            {/* Link Cadastro */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p 
                style={{
                  color: '#6b7280',
                  fontSize: '1rem',
                  margin: 0
                }}
              >
                Não tem uma conta?{' '}
                <Link 
                  to="/cadastro" 
                  style={{
                    color: '#16a34a',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                  className="hover:text-green-800 hover:underline transition-colors duration-200"
                >
                  Cadastre-se agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de cadastro completo para login via Google */}
      {showGoogleForm && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50
          }}
        >
          <Card style={{ width: '100%', maxWidth: '28rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', backgroundColor: 'white' }}>
            {/* Header do modal */}
            <CardHeader 
              style={{
                background: 'linear-gradient(to right, #166534, #65a30d)',
                color: 'white',
                borderRadius: '0.5rem 0.5rem 0 0',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setShowGoogleForm(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="hover:text-white hover:bg-white/20"
              >
                ×
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <div 
                  style={{
                    width: '3rem',
                    height: '3rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem'
                  }}
                >
                  <FaUser style={{ fontSize: '1.25rem', color: 'white' }} />
                </div>
                <CardTitle style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Complete seu cadastro</CardTitle>
                <p 
                  style={{
                    color: '#dcfce7',
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0
                  }}
                >
                  <FaExclamationTriangle style={{ color: '#fde047', marginRight: '0.5rem' }} />
                  É necessário completar seu cadastro para continuar
                </p>
              </div>
            </CardHeader>
            
            <CardContent style={{ padding: '1.5rem' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleGoogleLogin();
                setShowGoogleForm(false);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Nome completo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label 
                    htmlFor="nome" 
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaUser style={{ marginRight: '0.5rem', color: '#16a34a' }} />
                    Nome completo
                  </label>
                  <Input
                    id="nome"
                    type="text"
                    value={googleUserData.nome}
                    onChange={(e) => setGoogleUserData({...googleUserData, nome: e.target.value})}
                    style={{
                      height: '2.75rem',
                      borderColor: '#d1d5db'
                    }}
                    className="focus:border-green-500 focus:ring-green-500"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                
                {/* CPF/CNPJ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label 
                    htmlFor="cpfCnpj" 
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaIdCard style={{ marginRight: '0.5rem', color: '#16a34a' }} />
                    CPF/CNPJ
                  </label>
                  <Input
                    id="cpfCnpj"
                    type="text"
                    value={googleUserData.cpfCnpj}
                    onChange={(e) => setGoogleUserData({...googleUserData, cpfCnpj: e.target.value})}
                    style={{
                      height: '2.75rem',
                      borderColor: '#d1d5db'
                    }}
                    className="focus:border-green-500 focus:ring-green-500"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    required
                  />
                </div>
                
                {/* Telefone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label 
                    htmlFor="telefone" 
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaPhone style={{ marginRight: '0.5rem', color: '#16a34a' }} />
                    Telefone
                  </label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={googleUserData.telefone}
                    onChange={(e) => setGoogleUserData({...googleUserData, telefone: e.target.value})}
                    style={{
                      height: '2.75rem',
                      borderColor: '#d1d5db'
                    }}
                    className="focus:border-green-500 focus:ring-green-500"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                
                {/* Endereço */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label 
                    htmlFor="endereco" 
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    Endereço completo
                  </label>
                  <textarea
                    id="endereco"
                    value={googleUserData.endereco}
                    onChange={(e) => setGoogleUserData({...googleUserData, endereco: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      resize: 'none',
                      fontSize: '0.875rem'
                    }}
                    className="focus:border-green-500 focus:ring-green-500"
                    rows="3"
                    placeholder="Rua, número, bairro, cidade, estado, CEP"
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoogleForm(false)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      border: '1px solid #d1d5db',
                      color: '#374151',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      transition: 'colors 0.2s',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                    className="hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(to right, #166534, #65a30d)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    className="hover:from-green-900 hover:to-lime-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div 
                          style={{
                            animation: 'spin 1s linear infinite',
                            borderRadius: '50%',
                            height: '1rem',
                            width: '1rem',
                            border: '2px solid white',
                            borderTop: '2px solid transparent',
                            marginRight: '0.5rem'
                          }}
                        ></div>
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
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
