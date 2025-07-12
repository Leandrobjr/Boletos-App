import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Componentes de layout
import Layout from './components/Layout';

// Sistema de autenticação
import { AuthProvider, useAuth } from './components/auth/AuthProvider';

// Páginas
import LoginPage from './pages/LoginPage';
import CadastroPage from './pages/CadastroPage';
import VendedorPage from './pages/VendedorPage';
import CompradorPage from './pages/CompradorPage';
import DashboardGestaoPage from './pages/DashboardGestaoPage';
import Landpage from './pages/Landpage';
import ConfirmacaoCompra from './pages/ConfirmacaoCompra';
import AlterarCadastroPage from './pages/AlterarCadastroPage';

// Componente de rota protegida
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, perfilVerificado } = useAuth();
  console.log('[DEBUG] ProtectedRoute: isAuthenticated=', isAuthenticated, 'perfilVerificado=', perfilVerificado);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Bloquear acesso a rotas protegidas se cadastro incompleto (agora usando perfilVerificado)
  if (!perfilVerificado) {
    return <Navigate to="/alterar-cadastro" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landpage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<Layout />}>
        <Route index element={<CadastroPage />} />
      </Route>
      <Route path="/alterar-cadastro" element={<Layout />}>
        <Route index element={<AlterarCadastroPage />} />
      </Route>
      {/* Rotas protegidas */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/comprador" />} />
        <Route path="vendedor" element={<VendedorPage />} />
        <Route path="comprador" element={<CompradorPage />} />
        <Route path="comprador-original" element={<CompradorPage />} />
        <Route path="gestao" element={<DashboardGestaoPage />} />
        <Route path="confirmacao/:id" element={<ConfirmacaoCompra />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
