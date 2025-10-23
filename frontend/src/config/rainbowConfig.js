import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';

// Configuração das chains suportadas - Wagmi v2
const chains = [polygonAmoy, polygon];

// Configuração do Wagmi v2 com RainbowKit
const wagmiConfig = getDefaultConfig({
  appName: 'BoletoXCrypto',
  projectId: 'YOUR_PROJECT_ID', // Substitua pelo seu Project ID do WalletConnect
  chains,
  ssr: false, // Se você não estiver usando SSR
});

export { wagmiConfig, chains };
