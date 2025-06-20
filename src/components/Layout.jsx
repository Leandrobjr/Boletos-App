import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { FaUser, FaBars, FaTimes } from 'react-icons/fa';
import WalletConnector from './WalletConnector';
import { FaHome, FaFileInvoiceDollar, FaChartBar, FaWallet, FaBitcoin } from 'react-icons/fa';
import '../styles/fonts.css';
import { colors } from '../styles/colors';

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.gray[50] }}>
      {/* Cabeçalho */}
      <header style={{ backgroundColor: colors.primary, color: colors.white, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaBitcoin className="text-3xl" style={{ color: colors.secondary }} />
            <h1 className="text-2xl font-bold bitcoin-font" style={{ color: colors.white }}>BoletoXCrypto</h1>
          </div>
          
          {/* Menu para desktop */}
          <nav className="hidden md:flex space-x-6">
            <NavLink 
              to="/comprador" 
              className="py-2 px-1"
              style={({ isActive }) => ({
                fontWeight: isActive ? 'bold' : 'normal',
                borderBottom: isActive ? `2px solid ${colors.white}` : 'none',
                color: colors.white,
                transition: 'all 0.2s ease-in-out'
              })}
            >
              Comprador
            </NavLink>
            <NavLink 
              to="/vendedor" 
              className="py-2 px-1"
              style={({ isActive }) => ({
                fontWeight: isActive ? 'bold' : 'normal',
                borderBottom: isActive ? `2px solid ${colors.white}` : 'none',
                color: colors.white,
                transition: 'all 0.2s ease-in-out'
              })}
            >
              Vendedor
            </NavLink>
            <NavLink 
              to="/gestao" 
              className="py-2 px-1"
              style={({ isActive }) => ({
                fontWeight: isActive ? 'bold' : 'normal',
                borderBottom: isActive ? `2px solid ${colors.white}` : 'none',
                color: colors.white,
                transition: 'all 0.2s ease-in-out'
              })}
            >
              Dashboard Gestão
            </NavLink>
            <NavLink 
              to="/ui" 
              className="py-2 px-1"
              style={({ isActive }) => ({
                fontWeight: isActive ? 'bold' : 'normal',
                borderBottom: isActive ? `2px solid ${colors.white}` : 'none',
                color: colors.white,
                transition: 'all 0.2s ease-in-out'
              })}
            >
              UI Kit
            </NavLink>
          </nav>
          
          {/* Perfil e botão de menu mobile */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                className="p-1 rounded-full" 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                <FaUser style={{ color: colors.white }} />
              </button>
            </div>
            
            {/* Botão do menu mobile */}
            <button 
              className="md:hidden p-2"
              onClick={toggleMobileMenu}
              style={{ transition: 'all 0.2s ease-in-out' }}
            >
              {isMobileMenuOpen ? (
                <FaTimes style={{ color: colors.white }} />
              ) : (
                <FaBars style={{ color: colors.white }} />
              )}
            </button>
          </div>
        </div>
        
        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 py-2" style={{ 
            backgroundColor: colors.primary, 
            borderTop: `1px solid rgba(255, 255, 255, 0.2)`,
            animation: 'slideDown 0.3s ease-in-out'
          }}>
            <nav className="flex flex-col space-y-2">
              <NavLink 
                to="/comprador" 
                className="py-2"
                style={({ isActive }) => ({
                  fontWeight: isActive ? 'bold' : 'normal',
                  borderLeft: isActive ? `4px solid ${colors.white}` : 'none',
                  paddingLeft: isActive ? '8px' : '12px',
                  color: colors.white,
                  transition: 'all 0.2s ease-in-out'
                })}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Comprador
              </NavLink>
              <NavLink 
                to="/vendedor" 
                className="py-2"
                style={({ isActive }) => ({
                  fontWeight: isActive ? 'bold' : 'normal',
                  borderLeft: isActive ? `4px solid ${colors.white}` : 'none',
                  paddingLeft: isActive ? '8px' : '12px',
                  color: colors.white,
                  transition: 'all 0.2s ease-in-out'
                })}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Vendedor
              </NavLink>
              <NavLink 
                to="/gestao" 
                className="py-2"
                style={({ isActive }) => ({
                  fontWeight: isActive ? 'bold' : 'normal',
                  borderLeft: isActive ? `4px solid ${colors.white}` : 'none',
                  paddingLeft: isActive ? '8px' : '12px',
                  color: colors.white,
                  transition: 'all 0.2s ease-in-out'
                })}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard Gestão
              </NavLink>
              <NavLink 
                to="/ui" 
                className="py-2"
                style={({ isActive }) => ({
                  fontWeight: isActive ? 'bold' : 'normal',
                  borderLeft: isActive ? `4px solid ${colors.white}` : 'none',
                  paddingLeft: isActive ? '8px' : '12px',
                  color: colors.white,
                  transition: 'all 0.2s ease-in-out'
                })}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                UI Kit
              </NavLink>
            </nav>
          </div>
        )}
      </header>
      
      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      {/* Rodapé */}
      <footer style={{ backgroundColor: colors.gray[900], color: colors.white, padding: '16px 0' }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FaBitcoin style={{ color: colors.secondary, marginRight: '8px', fontSize: '1.5rem' }} />
              <span className="bitcoin-font" style={{ color: colors.white }}>BoletoXCrypto</span>
            </div>
            <p style={{ color: colors.gray[400], fontSize: '0.875rem' }}>
              &copy; {new Date().getFullYear()} Sistema de Gerenciamento de Boletos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
