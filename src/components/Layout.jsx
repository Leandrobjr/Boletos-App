import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { FaUser, FaBars, FaTimes } from 'react-icons/fa';
import WalletConnector from './WalletConnector';
import { FaHome, FaFileInvoiceDollar, FaChartBar, FaWallet, FaBitcoin } from 'react-icons/fa';
import '../styles/fonts.css';

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaBitcoin className="text-3xl text-yellow-400" />
            <h1 className="text-2xl font-bold bitcoin-font">BoletoXCrypto</h1>
          </div>
          
          {/* Menu para desktop */}
          <nav className="hidden md:flex space-x-6">
            <NavLink 
              to="/comprador" 
              className={({ isActive }) => 
                isActive ? "font-bold border-b-2 border-white" : "hover:text-gray-200"
              }
            >
              Comprador
            </NavLink>
            <NavLink 
              to="/vendedor" 
              className={({ isActive }) => 
                isActive ? "font-bold border-b-2 border-white" : "hover:text-gray-200"
              }
            >
              Vendedor
            </NavLink>
            <NavLink 
              to="/gestao" 
              className={({ isActive }) => 
                isActive ? "font-bold border-b-2 border-white" : "hover:text-gray-200"
              }
            >
              Dashboard Gestão
            </NavLink>
          </nav>
          
          {/* Perfil e botão de menu mobile */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="p-1 rounded-full bg-white/20 hover:bg-white/30">
                <FaUser className="text-white" />
              </button>
            </div>
            
            {/* Botão do menu mobile */}
            <button 
              className="md:hidden p-2"
              onClick={toggleMobileMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary border-t border-white/20 px-4 py-2">
            <nav className="flex flex-col space-y-2">
              <NavLink 
                to="/comprador" 
                className={({ isActive }) => 
                  isActive ? "font-bold border-l-4 border-white pl-2" : "pl-2 hover:text-gray-200"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Comprador
              </NavLink>
              <NavLink 
                to="/vendedor" 
                className={({ isActive }) => 
                  isActive ? "font-bold border-l-4 border-white pl-2" : "pl-2 hover:text-gray-200"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Vendedor
              </NavLink>
              <NavLink 
                to="/gestao" 
                className={({ isActive }) => 
                  isActive ? "font-bold border-l-4 border-white pl-2" : "pl-2 hover:text-gray-200"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard Gestão
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
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Sistema de Gerenciamento de Boletos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
