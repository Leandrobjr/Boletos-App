// Coleta de taxas acumuladas do contrato P2P Escrow para o owner
// Usa variáveis de ambiente: OWNER_PRIVATE_KEY, AMOY_RPC_URL, P2P_ESCROW_ADDRESS

const { ethers } = require('ethers');
const { requireAdmin } = require('../_utils/adminAuth');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

module.exports = async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Autorização administrativa obrigatória
  if (!(await requireAdmin(req, res))) return;

  try {
    const rpcUrl = process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';
    const escrow = process.env.P2P_ESCROW_ADDRESS || '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2';
    const pk = process.env.OWNER_PRIVATE_KEY;
    if (!pk) return res.status(400).json({ error: 'OWNER_PRIVATE_KEY não configurada' });

    // Compatibilidade entre ethers v5 e v6
    const provider = (ethers.JsonRpcProvider)
      ? new ethers.JsonRpcProvider(rpcUrl)
      : new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(pk, provider);
    const abi = [
      'function owner() view returns (address)',
      'function usdt() view returns (address)',
      'function emergencyWithdraw(address _token)'
    ];

    const contract = new ethers.Contract(escrow, abi, wallet);
    const owner = await contract.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return res.status(403).json({ error: 'Carteira não é o owner do contrato', owner, signer: wallet.address });
    }

    const usdt = await contract.usdt();
    const tx = await contract.emergencyWithdraw(usdt);
    const receipt = await tx.wait();

    return res.status(200).json({ success: true, txHash: tx.hash, status: receipt.status });
  } catch (e) {
    console.error('Erro em /api/fees/collect:', e);
    return res.status(500).json({ error: 'Falha na coleta de taxas', details: e.message });
  }
};





