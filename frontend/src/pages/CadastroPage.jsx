import React, { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const CadastroPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleError, setGoogleError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    // Telefone
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.telefone)) {
      newErrors.telefone = 'Telefone deve estar no formato (11) 99999-9999';
    }

    // Senha
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 8) {
      newErrors.senha = 'Senha deve ter pelo menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter letra maiúscula, minúscula e número';
    }

    // Confirmar Senha
    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirme sua senha';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGoogleError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.senha
      );

      const user = userCredential.user;

      // Salvar dados no backend
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          telefone: formData.telefone,
          senha: formData.senha
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar usuário');
      }

      setSuccessMessage('Conta criada com sucesso! Redirecionando...');
      
      // Aguardar 2 segundos antes de redirecionar
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Erro no cadastro:', error);
      
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'E-mail já está em uso. Tente fazer login.';
        setErrors({ email: errorMessage });
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca. Use pelo menos 8 caracteres.';
        setErrors({ senha: errorMessage });
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
        setErrors({ email: errorMessage });
      } else if (error.message.includes('E-mail já cadastrado')) {
        errorMessage = 'E-mail já cadastrado. Tente fazer login.';
        setErrors({ email: errorMessage });
      } else if (error.message.includes('Senha muito fraca')) {
        errorMessage = 'Senha muito fraca. Use pelo menos 8 caracteres.';
        setErrors({ senha: errorMessage });
      } else if (error.message.includes('E-mail inválido')) {
        errorMessage = 'E-mail inválido.';
        setErrors({ email: errorMessage });
      } else {
        setErrors({ geral: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrors({});
    setGoogleError(null);
    setSuccessMessage(null);

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result && result.user) {
        setSuccessMessage('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro no login Google:', error);
      setGoogleError('Erro ao fazer login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      telefone: formatted
    }));
    
    if (errors.telefone) {
      setErrors(prev => ({
        ...prev,
        telefone: null
      }));
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
            {/* Mensagens de Sucesso/Erro */}
            {successMessage && (
              <div 
                style={{
                  backgroundColor: '#dcfce7',
                  border: '1px solid #16a34a',
                  color: '#15803d',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}
              >
                {successMessage}
              </div>
            )}

            {errors.geral && (
              <div 
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #dc2626',
                  color: '#dc2626',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}
              >
                {errors.geral}
              </div>
            )}

            <form 
              onSubmit={handleSubmit}
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
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: errors.nome ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: errors.nome ? '#fef2f2' : '#ffffff'
                    }}
                    className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Digite seu nome completo"
                    required
                    disabled={loading}
                  />
                  {errors.nome && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.nome}
                    </p>
                  )}
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
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: errors.email ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: errors.email ? '#fef2f2' : '#ffffff'
                    }}
                    className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                  {errors.email && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.email}
                    </p>
                  )}
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
                    name="telefone"
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: errors.telefone ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: errors.telefone ? '#fef2f2' : '#ffffff'
                    }}
                    className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="(11) 99999-9999"
                    required
                    disabled={loading}
                  />
                  {errors.telefone && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.telefone}
                    </p>
                  )}
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
                      name="senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: '3rem',
                        border: errors.senha ? '1px solid #dc2626' : '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box',
                        backgroundColor: errors.senha ? '#fef2f2' : '#ffffff'
                      }}
                      className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Mínimo 8 caracteres"
                      required
                      disabled={loading}
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
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </button>
                  </div>
                  {errors.senha && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.senha}
                    </p>
                  )}
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
                      name="confirmarSenha"
                      value={formData.confirmarSenha}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: '3rem',
                        border: errors.confirmarSenha ? '1px solid #dc2626' : '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box',
                        backgroundColor: errors.confirmarSenha ? '#fef2f2' : '#ffffff'
                      }}
                      className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Confirme sua senha"
                      required
                      disabled={loading}
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
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </button>
                  </div>
                  {errors.confirmarSenha && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.confirmarSenha}
                    </p>
                  )}
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
                    disabled={loading}
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
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#9ca3af' : 'linear-gradient(to right, #16a34a, #15803d)',
                    color: '#ffffff',
                    fontWeight: '600',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    marginTop: '0.5rem',
                    opacity: loading ? 0.7 : 1
                  }}
                  className="hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Criando conta...
                    </div>
                  ) : (
                    'Criar Conta'
                  )}
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
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                border: '1px solid #d1d5db',
                color: loading ? '#9ca3af' : '#374151',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              className="hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={handleGoogleLogin}
            >
              {loading ? (
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #6b7280',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
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
              )}
              <span>{loading ? 'Conectando...' : 'Entrar com Google'}</span>
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default CadastroPage;