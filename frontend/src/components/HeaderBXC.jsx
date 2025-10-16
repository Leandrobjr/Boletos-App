import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';

const HeaderBXC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Função para pegar o primeiro nome com a primeira letra maiúscula
  const getFirstName = () => {
    if (!user) return '';
    let name = user.displayName || user.email?.split('@')[0] || '';
    name = name.split(' ')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  // Dados do usuário
  const nomeCompleto = user?.displayName || '';
  const email = user?.email || '';
  const telefone = user?.phoneNumber || '';

  return (
    <header style={{ background: '#059669', borderBottom: '2px solid #047857', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)', padding: '0', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 72 }}>
        {/* Título alinhado à esquerda */}
        <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', color: '#fff', textAlign: 'left' }}>
          <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>₿</span>oletoXCrypto
        </div>
        {/* Botões alinhados à direita */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={{ padding: '10px 22px', background: '#d9f99d', color: '#166534', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Início</Link>
          <Link to="/app/comprador" style={{ padding: '10px 22px', background: '#d9f99d', color: '#166534', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Comprador</Link>
          <Link to="/app/vendedor" style={{ padding: '10px 22px', background: '#d9f99d', color: '#166534', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Vendedor</Link>
          <Link to="/app/gestao" style={{ padding: '10px 22px', background: '#d9f99d', color: '#166534', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Gestão</Link>
          {!isAuthenticated ? (
            <Link to="/login" style={{ padding: '10px 22px', background: '#fff', color: '#166534', border: '2px solid #166534', borderRadius: 12, fontWeight: 700, marginLeft: 12 }}>
              Entrar
            </Link>
          ) : (
            <div style={{ position: 'relative', display: 'inline-block', marginLeft: 12 }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                style={{ padding: '10px 22px', background: '#d9f99d', color: '#166534', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {`Bem-vindo, ${getFirstName()}!`}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', color: '#222', border: '1px solid #ccc', borderRadius: 8, minWidth: 220, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 1000, padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{nomeCompleto}</div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{email}</div>
                  {telefone && <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{telefone}</div>}
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/alterar-cadastro'); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#166534', padding: '8px 0', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Alterar cadastro
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#b91c1c', padding: '8px 0', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default HeaderBXC; 