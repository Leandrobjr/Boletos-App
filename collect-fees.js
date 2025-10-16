// Script para coletar taxas acumuladas do contrato P2P Escrow
// Execute: node collect-fees.js

const { ethers } = require('ethers');

// Configuração
const RPC_URL = 'https://rpc-amoy.polygon.technology';
const ESCROW_ADDRESS = '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2';
const USDT_ADDRESS = '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD';
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY; // Configure no .env ou export

// ABI do contrato
const ABI = [
  'function owner() view returns (address)',
  'function usdt() view returns (address)',
  'function emergencyWithdraw(address _token)'
];

async function collectFees() {
  try {
    if (!OWNER_PRIVATE_KEY) {
      throw new Error('OWNER_PRIVATE_KEY não configurada. Configure: export OWNER_PRIVATE_KEY=0x...');
    }

    console.log('🔗 Conectando à rede Polygon Amoy...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    
    console.log('👤 Carteira:', wallet.address);
    
    const contract = new ethers.Contract(ESCROW_ADDRESS, ABI, wallet);
    
    // Verificar owner
    const owner = await contract.owner();
    console.log('🏛️ Owner do contrato:', owner);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error(`Carteira ${wallet.address} não é o owner do contrato`);
    }
    
    // Verificar saldo USDT do contrato
    const usdtContract = new ethers.Contract(USDT_ADDRESS, [
      'function balanceOf(address account) view returns (uint256)'
    ], provider);
    
    const balance = await usdtContract.balanceOf(ESCROW_ADDRESS);
    const balanceUsdt = ethers.formatUnits(balance, 6);
    console.log('💰 Saldo USDT do contrato:', balanceUsdt, 'USDT');
    
    if (balance === 0n) {
      console.log('✅ Nenhuma taxa para coletar');
      return;
    }
    
    // Executar coleta
    console.log('🚀 Executando emergencyWithdraw...');
    const tx = await contract.emergencyWithdraw(USDT_ADDRESS);
    console.log('📝 Transação enviada:', tx.hash);
    
    console.log('⏳ Aguardando confirmação...');
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Taxas coletadas com sucesso!');
      console.log('📊 TX Hash:', tx.hash);
      console.log('⛽ Gas usado:', receipt.gasUsed.toString());
    } else {
      console.log('❌ Transação falhou');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

collectFees();





