// Script final para coletar taxas - substitua SUA_CHAVE_PRIVADA pela chave real
// Execute: node collect-fees-final.js

const { ethers } = require('ethers');

// ⚠️ SUBSTITUA PELA SUA CHAVE PRIVADA REAL (formato: 0x + 64 caracteres hex)
const OWNER_PRIVATE_KEY = "0x4b9458079da2730f225becfcbafb79d740aa4507164016367760a6bb275ae14b";

// Configuração
const RPC_URL = 'https://rpc-amoy.polygon.technology';
const ESCROW_ADDRESS = '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2';
const USDT_ADDRESS = '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD';

// ABI do contrato P2P Escrow
const ESCROW_ABI = [
  'function owner() view returns (address)',
  'function usdt() view returns (address)',
  'function emergencyWithdraw(address _token)',
  'function withdrawFees() external', // Tentar função alternativa
  'function collectFees() external'   // Tentar função alternativa
];

// ABI do USDT
const USDT_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

async function collectFeesFinal() {
  try {
    if (OWNER_PRIVATE_KEY === "SUA_CHAVE_PRIVADA_AQUI") {
      throw new Error('⚠️ Substitua SUA_CHAVE_PRIVADA_AQUI pela sua chave privada real no código');
    }

    console.log('🔗 Conectando à rede Polygon Amoy...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    
    console.log('👤 Carteira:', wallet.address);
    
    const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, wallet);
    const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
    
    // Verificar owner
    const owner = await escrowContract.owner();
    console.log('🏛️ Owner do contrato:', owner);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error(`Carteira ${wallet.address} não é o owner do contrato`);
    }
    
    // Verificar saldo USDT do contrato
    const balance = await usdtContract.balanceOf(ESCROW_ADDRESS);
    const balanceUsdt = ethers.formatUnits(balance, 6);
    console.log('💰 Saldo USDT do contrato:', balanceUsdt, 'USDT');
    
    if (balance === 0n) {
      console.log('✅ Nenhuma taxa para coletar');
      return;
    }
    
    // Tentar diferentes métodos de coleta
    console.log('🚀 Tentando coleta de taxas...');
    
    try {
      // Método 1: emergencyWithdraw
      console.log('📋 Método 1: emergencyWithdraw...');
      const tx1 = await escrowContract.emergencyWithdraw(USDT_ADDRESS);
      console.log('📝 Transação enviada:', tx1.hash);
      const receipt1 = await tx1.wait();
      
      if (receipt1.status === 1) {
        console.log('✅ Taxas coletadas com sucesso via emergencyWithdraw!');
        console.log('📊 TX Hash:', tx1.hash);
        return;
      }
    } catch (error1) {
      console.log('❌ emergencyWithdraw falhou:', error1.message);
    }
    
    try {
      // Método 2: withdrawFees
      console.log('📋 Método 2: withdrawFees...');
      const tx2 = await escrowContract.withdrawFees();
      console.log('📝 Transação enviada:', tx2.hash);
      const receipt2 = await tx2.wait();
      
      if (receipt2.status === 1) {
        console.log('✅ Taxas coletadas com sucesso via withdrawFees!');
        console.log('📊 TX Hash:', tx2.hash);
        return;
      }
    } catch (error2) {
      console.log('❌ withdrawFees falhou:', error2.message);
    }
    
    try {
      // Método 3: collectFees
      console.log('📋 Método 3: collectFees...');
      const tx3 = await escrowContract.collectFees();
      console.log('📝 Transação enviada:', tx3.hash);
      const receipt3 = await tx3.wait();
      
      if (receipt3.status === 1) {
        console.log('✅ Taxas coletadas com sucesso via collectFees!');
        console.log('📊 TX Hash:', tx3.hash);
        return;
      }
    } catch (error3) {
      console.log('❌ collectFees falhou:', error3.message);
    }
    
    console.log('❌ Todos os métodos de coleta falharam');
    console.log('💡 Possíveis causas:');
    console.log('   - Contrato tem validações específicas');
    console.log('   - Taxas já foram coletadas');
    console.log('   - Função requer parâmetros adicionais');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

collectFeesFinal();





