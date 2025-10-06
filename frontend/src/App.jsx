import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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

// Cache Buster - Força invalidação automática
const forceCacheClear = () => {
  console.log('🔄 FORÇANDO LIMPEZA DE CACHE AUTOMÁTICA');
  
  // Limpar localStorage
  try {
    localStorage.clear();
    console.log('✅ localStorage limpo');
  } catch (e) {
    console.log('❌ Erro ao limpar localStorage:', e);
  }
  
  // Limpar sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage limpo');
  } catch (e) {
    console.log('❌ Erro ao limpar sessionStorage:', e);
  }
  
  // Limpar caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`🗑️ Cache deletado: ${name}`);
      });
    });
  }
  
  // Unregister Service Workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('🔄 Service Worker desregistrado');
      });
    });
  }
};

// Componente de rota protegida
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, perfilVerificado } = useAuth();

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
  // Cache Buster DESABILITADO - Problema resolvido
  // useEffect(() => {
  //   const cacheVersion = localStorage.getItem('app_cache_version');
  //   const currentVersion = Date.now().toString();
  //   
  //   if (cacheVersion !== currentVersion) {
  //     console.log('🔄 VERSÃO DE CACHE DIFERENTE - FORÇANDO LIMPEZA');
  //     forceCacheClear();
  //     localStorage.setItem('app_cache_version', currentVersion);
  //     
  //     // Força reload após limpeza
  //     setTimeout(() => {
  //       window.location.reload(true);
  //     }, 1000);
  //   }
  // }, []);

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
        <Route path="comprador/comprovante/:id" element={<ComprovantePage />} />
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
