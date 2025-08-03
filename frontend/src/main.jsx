import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import './styles/shadcn-theme.css'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, chains } from './config/rainbowConfig';
import '@rainbow-me/rainbowkit/styles.css';

console.log('main.jsx carregado');

// Configuração robusta do QueryClient para evitar problemas de cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Função para limpar storage de forma segura
const clearWalletStorage = () => {
  try {
    // Limpar chaves específicas do Wagmi
    const keysToRemove = [
      'wagmi.connected',
      'wagmi.wallet',
      'wagmi.store',
      'wagmi.cache',
      'wagmi.connectedConnector',
      'rainbow-me',
      'wc@2',
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        // Falha silenciosa se storage bloqueado
        console.log(`Storage cleaning blocked for ${key}`);
      }
    });
  } catch (e) {
    console.log('Storage access blocked, continuing without cleanup');
  }
};

// Limpeza ao recarregar
window.addEventListener('beforeunload', clearWalletStorage);

// Configuração de permissões para storage (anti-tracking prevention)
if (typeof window !== 'undefined') {
  // Tentar solicitar permissão de storage
  if ('storage' in navigator && 'persist' in navigator.storage) {
    navigator.storage.persist().catch(() => {
      // Falha silenciosa
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          chains={chains} 
          modalSize="compact"
          coolMode={false}
          showRecentTransactions={false}
        >
          <Router>
            <App />
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
