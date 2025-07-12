import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { ESCROW_CONTRACT_ADDRESS } from '../config/escrowConfig';
import escrowAbi from '../contracts/abis/P2PEscrow.json';

export function useBoletoEscrow() {
  const { address } = useAccount();

  // Travar valor do boleto (lock USDT no contrato)
  const travarBoleto = async ({ boletoId, valorUsdt, buyer }) => {
    try {
      const { writeAsync } = useWriteContract({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: 'createEscrow',
      });
      const tx = await writeAsync({ args: [boletoId, valorUsdt, buyer] });
      const receipt = await tx.wait();
      return { success: true, txHash: tx.hash, receipt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Liberar valor do boleto (release escrow)
  const liberarBoleto = async ({ escrowId }) => {
    try {
      const { writeAsync } = useWriteContract({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: 'releaseEscrow',
      });
      const tx = await writeAsync({ args: [escrowId] });
      const receipt = await tx.wait();
      return { success: true, txHash: tx.hash, receipt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Consultar status do boleto (on-chain)
  const consultarStatus = async ({ escrowId }) => {
    try {
      const { data } = useReadContract({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: 'getEscrowStatus',
        args: [escrowId],
      });
      return { status: data };
    } catch (e) {
      return { status: 'ERRO', error: e.message };
    }
  };

  return { travarBoleto, liberarBoleto, consultarStatus };
} 