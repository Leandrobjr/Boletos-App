import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { updateProfile, updatePassword } from 'firebase/auth';
import { buildApiUrl } from '../config/apiConfig';

const AlterarCadastroPage = () => {
  const { user } = useAuth();
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
  const [successMessage, setSuccessMessage] = useState('');
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

    // Senha (opcional, mas se preenchida deve ser válida)
    if (formData.senha) {
      if (formData.senha.length < 8) {
        newErrors.senha = 'Senha deve ter pelo menos 8 caracteres';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
        newErrors.senha = 'Senha deve conter letra maiúscula, minúscula e número';
      }
    }

    // Confirmar Senha
    if (formData.senha && !formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirme sua senha';
    } else if (formData.senha && formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  // Buscar dados do backend ao carregar a página
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }));

      fetch(buildApiUrl(`/perfil/${user.uid}`))
        .then(res => res.json())
        .then(data => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              nome: data.nome || user.displayName || '',
              telefone: data.telefone || user.phoneNumber || ''
            }));
            
            // Redireciona se nome, telefone e email já estiverem preenchidos
            if ((data.nome || user.displayName) && (data.telefone || user.phoneNumber) && (data.email || user.email)) {
              navigate('/');
            }
          } else {
            setFormData(prev => ({
              ...prev,
              nome: user.displayName || '',
              telefone: user.phoneNumber || ''
            }));
          }
        })
        .catch(() => {
          setFormData(prev => ({
            ...prev,
            nome: user.displayName || '',
            telefone: user.phoneNumber || ''
          }));
        });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Atualizar nome completo no Firebase Auth
      if (auth.currentUser && formData.nome) {
        await updateProfile(auth.currentUser, { displayName: formData.nome });
      }

      // Atualizar senha se fornecida
      if (formData.senha && auth.currentUser) {
        await updatePassword(auth.currentUser, formData.senha);
      }

      // Salvar dados no backend
      if (user) {
        const response = await fetch(buildApiUrl('/perfil'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: user.uid,
            nome: formData.nome.trim(),
            email: formData.email.trim(),
            telefone: formData.telefone
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar dados no servidor');
        }
      }

      setSuccessMessage('Dados atualizados com sucesso! Redirecionando...');
      
      // Limpar senhas
      setFormData(prev => ({
        ...prev,
        senha: '',
        confirmarSenha: ''
      }));

      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      
      let errorMessage = 'Erro ao atualizar dados. Tente novamente.';
      
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca. Use pelo menos 8 caracteres.';
        setErrors({ senha: errorMessage });
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Para alterar a senha, faça login novamente.';
        setErrors({ senha: errorMessage });
      } else {
        setErrors({ geral: errorMessage });
      }
    } finally {
      setLoading(false);
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
              Confirmar/Alterar Cadastro
            </h1>
            <p 
              style={{
                color: '#dcfce7',
                fontSize: '0.875rem'
              }}
            >
              Complete seus dados para acessar o sistema
            </p>
          </div>

          {/* Aviso */}
          <div 
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              textAlign: 'center',
              fontWeight: '500'
            }}
          >
            Para acessar o sistema, complete seu cadastro com nome completo e telefone.
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
                      backgroundColor: errors.email ? '#fef2f2' : '#f9fafb'
                    }}
                    className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="seu@email.com"
                    required
                    disabled={true}
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

                {/* Nova Senha */}
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
                    Nova Senha (opcional)
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
                      placeholder="Deixe em branco para não alterar"
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
                {formData.senha && (
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
                      Confirmar Nova Senha
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
                        placeholder="Confirme a nova senha"
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
                )}

                {/* Botão Salvar */}
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
                      Salvando alterações...
                    </div>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
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

export default AlterarCadastroPage; 