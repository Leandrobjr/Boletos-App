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
import UIShowcasePage from './pages/UIShowcasePage';
import Landpage from './pages/Landpage';
import HomePage from './pages/HomePage';
import ConfirmacaoCompra from './pages/ConfirmacaoCompra';
import ComprovantePage from './pages/ComprovantePage';
import TestePage from './pages/TestePage';
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
  if (typeof perfilVerificado !== 'undefined' && !perfilVerificado) {
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
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/teste" element={<Layout />}>
        <Route index element={<TestePage />} />
      </Route>
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
        <Route path="vendedor">
          <Route index element={<Navigate to="/app/vendedor/cadastrar" />} />
          <Route path=":tab" element={<VendedorPage />} />
        </Route>
        <Route path="comprador">
          <Route index element={<Navigate to="/app/comprador/comprar" />} />
          <Route path=":tab" element={<CompradorPage />} />
        </Route>
        <Route path="gestao" element={<DashboardGestaoPage />} />
        <Route path="ui" element={<UIShowcasePage />} />
        <Route path="confirmacao/:id" element={<ConfirmacaoCompra />} />
        <Route path="vendedor/comprovante/:id" element={<ComprovantePage />} />
      </Route>
    </Routes>
  );
}

function App() {
  console.log('App.jsx carregado');
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
