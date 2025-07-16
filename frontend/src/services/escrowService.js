<<<<<<< HEAD
import { ethers } from 'ethers';
import escrowAbi from '../abis/P2PEscrow.json';
import usdtAbi from '../abis/MockUSDT.json';
=======
// Remover toda lógica baseada em ethers.js e window.ethereum
// Recomendar uso de hooks wagmi/viem diretamente nos componentes
// Este arquivo pode ser removido ou transformado em utilitário puro, se necessário
>>>>>>> 713c63f07ad7641d5d75b9280eae8ac9c7c52de0

// Endereços dos contratos implantados na rede Polygon Amoy (atualizados em 16/06/2025)
export const ESCROW_ADDRESS = "0x728f2439F54538159255E5DAEf70ff381f741A01";
export const USDT_ADDRESS = "0xACF7805a9be2d71A3603C63f66226e2774363ebb";

// Aprova o contrato Escrow a gastar USDT do usuário (valor + taxa de 3%)
export async function approveUSDT(publicClient, account, amount) {
<<<<<<< HEAD
  try {
    // Na versão 2.x do wagmi, precisamos usar o window.ethereum diretamente
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const usdt = new ethers.Contract(USDT_ADDRESS, usdtAbi, signer);
    // Calcula valor total: valor + 3% de taxa
    const fee = amount * 300n / 10000n; // 3% usando BigInt
    const total = amount + fee;
    const tx = await usdt.approve(ESCROW_ADDRESS, total);
    await tx.wait();
    return {
      success: true,
      transaction: tx,
      message: "Aprovação de USDT realizada com sucesso"
    };
  } catch (error) {
    console.error("Erro ao aprovar USDT:", error);
    return {
      success: false,
      message: "Erro ao aprovar USDT: " + (error.message || error)
    };
  }
=======
  // ... existing code ...
>>>>>>> 713c63f07ad7641d5d75b9280eae8ac9c7c52de0
}

// Trava o valor no contrato Escrow usando createEscrow
export async function lockUSDT(publicClient, account, boletoId, amount) {
<<<<<<< HEAD
  try {
    // Na versão 2.x do wagmi, precisamos usar o window.ethereum diretamente
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, escrowAbi, signer);
    // Chama createEscrow(uint256 _boletoId, uint256 _amount, address _buyer)
    const tx = await escrow.createEscrow(boletoId, amount, account);
    await tx.wait();
    return {
      success: true,
      transaction: tx,
      message: "USDT travado com sucesso no contrato escrow"
    };
  } catch (error) {
    console.error("Erro ao travar USDT:", error);
    return {
      success: false,
      message: "Erro ao travar USDT: " + (error.message || error)
    };
  }
=======
  // ... existing code ...
>>>>>>> 713c63f07ad7641d5d75b9280eae8ac9c7c52de0
}

// Libera o valor do escrow para o comprador (BAIXAR BOLETO PAGO)
export async function releaseEscrow(publicClient, escrowId) {
<<<<<<< HEAD
  try {
    // Na versão 2.x do wagmi, precisamos usar o window.ethereum diretamente
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, escrowAbi, signer);
    
    const tx = await escrow.releaseEscrow(escrowId);
    await tx.wait();
    
    return {
      success: true,
      transaction: tx,
      message: "Boleto baixado com sucesso! USDT liberado para o comprador."
    };
  } catch (error) {
    console.error("Erro ao baixar boleto:", error);
    return {
      success: false,
      message: "Erro ao baixar boleto: " + (error.message || error)
    };
  }
=======
  // ... existing code ...
>>>>>>> 713c63f07ad7641d5d75b9280eae8ac9c7c52de0
}

// Utilitários para conversão de valor (de reais para USDT, etc) podem ser adicionados aqui