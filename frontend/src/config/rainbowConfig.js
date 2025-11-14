import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { polygon, polygonAmoy } from 'wagmi/chains';

const chains = [polygonAmoy, polygon];
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

let wagmiConfig;

if (projectId && typeof projectId === 'string' && projectId.trim().length > 0) {
  wagmiConfig = getDefaultConfig({
    appName: 'BoletoXCrypto',
    projectId,
    chains,
    ssr: false,
  });
} else {
  // Fallback seguro: somente carteira injetada, sem WalletConnect
  wagmiConfig = createConfig({
    chains,
    transports: {
      [polygonAmoy.id]: http(),
      [polygon.id]: http(),
    },
    connectors: [
      injected({ shimDisconnect: true })
    ],
    autoConnect: false,
  });
}

export { wagmiConfig, chains };
