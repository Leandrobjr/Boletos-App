import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// Configuração das chains suportadas - Wagmi v2
const chains = [polygonAmoy, polygon];

// WalletConnect Project ID (opcional, mas recomendado)
const projectId = 'bxc-boletos-app'; // ID simples para identificação

// Configuração robusta contra Tracking Prevention
const wagmiConfig = createConfig({
  chains,
  transports: {
    [polygonAmoy.id]: http(),
    [polygon.id]: http(),
  },
  connectors: [
    // MetaMask com configuração específica
    metaMask({
      shimDisconnect: true,
      UNSTABLE_shimOnConnectSelectAccount: true,
    }),
    // Connector injetado genérico
    injected({
      shimDisconnect: true,
      UNSTABLE_shimOnConnectSelectAccount: true,
    }),
    // WalletConnect como fallback
    walletConnect({
      projectId,
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '1000'
        }
      }
    })
  ],
  // Configurações avançadas para contornar tracking prevention
  storage: {
    getItem: (key) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Falha silenciosa se localStorage bloqueado
      }
    },
    removeItem: (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Falha silenciosa
      }
    },
  },
  autoConnect: false,
  syncConnectedChain: true,
});

export { wagmiConfig, chains };
