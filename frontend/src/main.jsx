import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import './styles/shadcn-theme.css'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, chains } from './config/rainbowConfig';
import '@rainbow-me/rainbowkit/styles.css';

console.log('main.jsx carregado');

const queryClient = new QueryClient();

// Limpa o localStorage das chaves de conexão da carteira ao recarregar/sair do app
window.addEventListener('beforeunload', () => {
  localStorage.removeItem('wagmi.connected');
  localStorage.removeItem('wagmi.wallet');
  localStorage.removeItem('wagmi.store');
  // Adicione outras chaves se necessário
});

// Registrar Service Worker para invalidação de cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('🔄 SW registered:', registration);
    })
    .catch(error => {
      console.log('❌ SW registration failed:', error);
    });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains} modalSize="compact">
    <Router>
      <App />
    </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </StrictMode>,
)
