// Remover toda lógica baseada em ethers.js e window.ethereum
// Recomendar uso de hooks wagmi/viem diretamente nos componentes
// Este arquivo pode ser removido ou transformado em utilitário puro, se necessário

// Endereços dos contratos implantados na rede Polygon Amoy (atualizados em 16/06/2025)
export const ESCROW_ADDRESS = "0x728f2439F54538159255E5DAEf70ff381f741A01";
export const USDT_ADDRESS = "0xACF7805a9be2d71A3603C63f66226e2774363ebb";

// Aprova o contrato Escrow a gastar USDT do usuário (valor + taxa de 3%)
export async function approveUSDT(publicClient, account, amount) {
  // ... existing code ...
}

// Trava o valor no contrato Escrow usando createEscrow
export async function lockUSDT(publicClient, account, boletoId, amount) {
  // ... existing code ...
}

// Libera o valor do escrow para o comprador (BAIXAR BOLETO PAGO)
export async function releaseEscrow(publicClient, escrowId) {
  // ... existing code ...
}

// Utilitários para conversão de valor (de reais para USDT, etc) podem ser adicionados aqui