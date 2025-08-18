import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../components/auth/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

function LoginPageTest() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login();
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #f0fdf4, #ecfccb, #f0fdf4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      {/* Background decorativo */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-16px',
          right: '-16px',
          width: '288px',
          height: '288px',
          background: '#d9f99d',
          borderRadius: '50%',
          opacity: 0.2,
          filter: 'blur(48px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-16px',
          left: '-16px',
          width: '384px',
          height: '384px',
          background: '#bbf7d0',
          borderRadius: '50%',
          opacity: 0.2,
          filter: 'blur(48px)'
        }}></div>
      </div>
      
      {/* Modal central */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '448px' }}>
        <Card style={{ 
          border: 'none', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)'
        }}>
          {/* Header com gradiente */}
          <CardHeader style={{
            background: 'linear-gradient(to right, #166534, #65a30d)',
            color: 'white',
            textAlign: 'center',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            padding: '32px'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <FaLock style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <CardTitle style={{ fontSize: '24px', fontWeight: 'bold' }}>
                BoletoXCrypto TEST
              </CardTitle>
              <p style={{ color: '#bbf7d0', marginTop: '8px', fontSize: '14px' }}>
                Acesse sua conta para continuar (VERSÃO TESTE)
              </p>
            </div>
          </CardHeader>
          
          <CardContent style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Campo Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FaEnvelope style={{ marginRight: '8px', color: '#16a34a' }} />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={{ height: '48px' }}
                />
              </div>
              
              {/* Campo Senha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FaLock style={{ marginRight: '8px', color: '#16a34a' }} />
                  Senha
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ height: '48px' }}
                />
              </div>
              
              {/* Botão Login */}
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'linear-gradient(to right, #166534, #65a30d)',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    Conectando...
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaLock style={{ marginRight: '8px' }} />
                    Acessar com senha (TESTE)
                  </div>
                )}
              </button>
            </form>
            
            {/* Link Cadastro */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280' }}>
                Não tem uma conta?{' '}
                <Link 
                  to="/cadastro" 
                  style={{ 
                    color: '#16a34a', 
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Cadastre-se agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPageTest;
