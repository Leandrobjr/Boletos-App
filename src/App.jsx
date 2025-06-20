import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Componentes de layout
import Layout from './components/Layout';

// Páginas
import LoginPage from './pages/LoginPage';
import CadastroPage from './pages/CadastroPage';
import VendedorPage from './pages/VendedorPage';
import CompradorPage from './pages/CompradorPage';
import DashboardGestaoPage from './pages/DashboardGestaoPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Função simulada de autenticação
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/cadastro" element={<CadastroPage />} />
        
        {/* Rotas protegidas */}
        <Route path="/" element={
          <Layout />
        }>
          <Route index element={<Navigate to="/comprador" />} />
          <Route path="vendedor" element={<VendedorPage />} />
          <Route path="comprador" element={<CompradorPage />} />
          <Route path="gestao" element={<DashboardGestaoPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
