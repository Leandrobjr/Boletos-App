import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId, useChains } from 'wagmi';

// Hook desabilitado. Use apenas hooks do wagmi e RainbowKit para conexão de carteira.
export function useWalletConnection() {
  throw new Error('useWalletConnection não deve ser usado. Use os hooks do wagmi e RainbowKit diretamente.');
} 