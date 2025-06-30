import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Componentes de layout
import Layout from './components/Layout';

// Páginas
import LoginPage from './pages/LoginPage';
import CadastroPage from './pages/CadastroPage';
import VendedorPage from './pages/VendedorPage';
import CompradorPage from './pages/CompradorPage';
import CompradorPageSimples from './pages/CompradorPageSimples';
import DashboardGestaoPage from './pages/DashboardGestaoPage';
import UIShowcasePage from './pages/UIShowcasePage';
import Landpage from './pages/Landpage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Função simulada de autenticação
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landpage />} />
        <Route path="/login" element={
          <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/cadastro" element={<CadastroPage />} />
        
        {/* Rotas protegidas */}
        <Route path="/app" element={
          <Layout />
        }>
          <Route index element={<Navigate to="/app/comprador" />} />
          <Route path="vendedor" element={<VendedorPage />} />
          <Route path="comprador" element={<CompradorPage />} />
          <Route path="comprador-original" element={<CompradorPage />} />
          <Route path="gestao" element={<DashboardGestaoPage />} />
          <Route path="ui" element={<UIShowcasePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
