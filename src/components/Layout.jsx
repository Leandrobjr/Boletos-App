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
import WalletConnector from './WalletConnector';
import { colors } from '../styles/colors';

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabeçalho */}
      <header className="bxc-gradient-primary sticky top-0 z-50" style={{ color: colors.white, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold" style={{ color: colors.white }}>
              <span className="bitcoin-font" style={{ color: colors.secondary }}>B</span>oletoXCrypto
            </h1>
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
      <main className="flex-grow bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bxc-page-container">
          <Outlet />
        </div>
      </main>
      
      {/* Rodapé compacto */}
      <footer className="bg-[#00A86B] border-t border-[#007C4F] mt-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-between items-center text-sm">
            <div className="w-full md:w-auto mb-2 md:mb-0">
              <div className="flex items-center">
                <h2 className="text-base font-bold text-white">
                  <span style={{ color: colors.secondary }}>B</span>oletoXCrypto
                </h2>
                <span className="mx-2 text-gray-200">|</span>
                <p className="text-gray-100 text-xs">A ponte entre boletos e cripto</p>
              </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-wrap justify-center md:justify-end">
              <div className="flex space-x-4 mr-6">
                <NavLink to="/comprador" className="text-gray-100 hover:text-white text-xs">Área do Comprador</NavLink>
                <NavLink to="/vendedor" className="text-gray-100 hover:text-white text-xs">Área do Vendedor</NavLink>
                <NavLink to="/gestao" className="text-gray-100 hover:text-white text-xs">Gestão</NavLink>
              </div>
              
              <div className="flex space-x-3 items-center">
                <a href="#" className="text-white hover:text-gray-200 transition-colors">
                  <FaTwitter size={16} />
                </a>
                <a href="#" className="text-white hover:text-gray-200 transition-colors">
                  <FaGithub size={16} />
                </a>
                <a href="#" className="text-white hover:text-gray-200 transition-colors">
                  <FaLinkedin size={16} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-green-600 mt-2 pt-2 text-center">
            <p className="text-gray-100 text-xs">&copy; {new Date().getFullYear()} BoletoXCrypto. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
