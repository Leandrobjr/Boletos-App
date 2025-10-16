import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { 
  FaUser, 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaFileInvoiceDollar, 
  FaChartBar, 
  FaWallet, 
  FaBitcoin,
  FaGithub,
  FaTwitter,
  FaLinkedin
} from 'react-icons/fa';
import ModernWalletConnector from "./wallet/ModernWalletConnector";
import { colors } from '../styles/colors';
import React, { Component } from 'react';
import HeaderBXC from './HeaderBXC';
import FooterBXC from './FooterBXC';

// Error Boundary simples
class SimpleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Pode logar o erro em um serviço externo se quiser
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: '#b91c1c', background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 12, margin: 32 }}>
          <h2>Ocorreu um erro inesperado.</h2>
          <p>Por favor, recarregue a página ou entre em contato com o suporte.</p>
          <pre style={{ color: '#991b1b', fontSize: 14 }}>{this.state.error?.message || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Layout(props) {
  console.log('Layout MONTADO');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <SimpleErrorBoundary>
      <div className="min-h-screen flex flex-col z-0">
        <HeaderBXC />
        {/* Conteúdo principal */}
        <main className="flex-grow bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="bxc-page-container">
            {/* Removido botão de voltar para a Landpage */}
            {props.children || <Outlet />}
          </div>
        </main>
        <FooterBXC />
      </div>
    </SimpleErrorBoundary>
  );
}

export default Layout;
