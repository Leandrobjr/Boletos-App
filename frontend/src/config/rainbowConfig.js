import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

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
    injected({ shimDisconnect: true }),
    walletConnect({ projectId: '9e1c87982132536c5e4ad04fd66d81d8', showQrModal: true }),
    coinbaseWallet({ appName: 'BXC Boletos' })
  ],
autoConnect: false
});

export { wagmiConfig, chains };
