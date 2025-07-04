import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId, useChains } from 'wagmi';

export function useWalletConnection() {
  const account = useAccount();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();
  const chainId = useChainId();
  const chains = useChains();

  return {
    ...account,
    ...connect,
    ...disconnect,
    ...switchChain,
    chainId,
    chains,
  };
} 