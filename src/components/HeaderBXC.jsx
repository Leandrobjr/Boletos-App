import React from 'react';
import { Link } from 'react-router-dom';

const HeaderBXC = () => (
  <header className="bxc-page-header" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 20, background: 'rgba(255,255,255,0.97)', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)', borderBottom: '2px solid #a3e635' }}>
    <div className="max-w-6xl mx-auto flex items-center justify-between px-8 py-3">
      <span className="bxc-page-title" style={{ fontSize: '2rem', color: '#65a30d', fontWeight: 800, letterSpacing: '-1px' }}>BoletoXCrypto</span>
      <nav className="flex gap-6 text-base font-bold" style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}>
        <Link to="/app/comprador" className="bxc-btn" style={{ padding: '10px 22px', background: '#d9f99d', color: '#365314', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700 }}>Comprador</Link>
        <Link to="/app/vendedor" className="bxc-btn" style={{ padding: '10px 22px', background: '#d9f99d', color: '#365314', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700 }}>Vendedor</Link>
        <Link to="/app/gestao" className="bxc-btn" style={{ padding: '10px 22px', background: '#d9f99d', color: '#365314', border: '2px solid #84cc16', borderRadius: 12, fontWeight: 700 }}>Gestão</Link>
        <Link to="/cadastro" className="bxc-btn bxc-btn-primary" style={{ padding: '10px 22px', background: '#166534', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700 }}>Cadastro/Login</Link>
      </nav>
    </div>
  </header>
);

export default HeaderBXC; 