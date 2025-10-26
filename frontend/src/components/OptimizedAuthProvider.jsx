/**
 * AuthProvider Otimizado - Resolve problemas de timeout e inconsistências
 * Substitui o AuthProvider original com melhor performance
 */

import React, { createContext, useContext } from 'react';
import { useOptimizedAuth } from '../hooks/useOptimizedAuth';

const AuthContext = createContext({});

export const OptimizedAuthProvider = ({ children }) => {
  console.log('🚀 [OPTIMIZED-AUTH-PROVIDER] Inicializando...');
  
  const authData = useOptimizedAuth();
  
  const contextValue = {
    ...authData,
    // Métodos de compatibilidade com o AuthProvider original
    login: authData.loginWithGoogle,
    signInWithGoogle: authData.loginWithGoogle,
    signOut: authData.logout,
    currentUser: authData.user,
    isLoggedIn: authData.isAuthenticated
  };

  console.log('📊 [OPTIMIZED-AUTH-PROVIDER] Estado atual:', {
    user: authData.user?.displayName || 'Não logado',
    loading: authData.loading,
    isAuthenticated: authData.isAuthenticated
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de OptimizedAuthProvider');
  }
  
  return context;
};

export default OptimizedAuthProvider;