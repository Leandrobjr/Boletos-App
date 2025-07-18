import { createConfig, http } from 'wagmi';
import { mainnet, polygon, polygonAmoy } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Configuração do Wagmi v2 com logs para depuração
console.log('Configurando wagmi com chains:', { polygonAmoy, polygon, mainnet });

// Configuração do Wagmi v2
export const config = createConfig({
  chains: [polygonAmoy, polygon, mainnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    metaMask(),
  ],
  transports: {
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [mainnet.id]: http(),
  },
});

console.log('Configuração do wagmi criada:', config);

export default config;
