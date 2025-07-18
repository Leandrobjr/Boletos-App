import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Configuração das chains suportadas - Wagmi v2
const chains = [polygonAmoy, polygon];

// Configuração do Wagmi v2
const wagmiConfig = createConfig({
  chains,
  transports: {
    [polygonAmoy.id]: http(),
    [polygon.id]: http(),
  },
  connectors: [
    injected({
      // Desativando a conexão automática
      shimDisconnect: true
    })
  ],
  autoConnect: false
});

export { wagmiConfig, chains };
