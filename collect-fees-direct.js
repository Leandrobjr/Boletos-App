// Script alternativo para coletar taxas via transferência direta
// Execute: node collect-fees-direct.js

const { ethers } = require('ethers');

// Configuração
const RPC_URL = 'https://rpc-amoy.polygon.technology';
const ESCROW_ADDRESS = '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2';
const USDT_ADDRESS = '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD';
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

// ABI do USDT
const USDT_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

async function collectFeesDirect() {
  try {
    if (!OWNER_PRIVATE_KEY) {
      throw new Error('OWNER_PRIVATE_KEY não configurada');
    }

    console.log('🔗 Conectando à rede Polygon Amoy...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    
    console.log('👤 Carteira:', wallet.address);
    
    // Verificar saldo USDT do contrato
    const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
    const balance = await usdtContract.balanceOf(ESCROW_ADDRESS);
    const balanceUsdt = ethers.formatUnits(balance, 6);
    console.log('💰 Saldo USDT do contrato:', balanceUsdt, 'USDT');
    
    if (balance === 0n) {
      console.log('✅ Nenhuma taxa para coletar');
      return;
    }
    
    // Tentar transferência direta do contrato para o owner
    console.log('🚀 Tentando transferência direta...');
    
    // Criar contrato USDT com signer do owner
    const usdtWithSigner = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);
    
    // Tentar transferir todo o saldo do contrato para o owner
    const tx = await usdtWithSigner.transfer(wallet.address, balance);
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
    
    if (error.message.includes('insufficient allowance')) {
      console.log('💡 Dica: O contrato precisa aprovar a transferência primeiro');
    }
  }
}

collectFeesDirect();





