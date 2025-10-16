const { ethers } = require('hardhat');

async function main() {
  // Endereços
  const MOCK_USDT = '0xB160a30D1612756AF9F6498d47384638D73b953e';
  const P2P_ESCROW = '0x07A09cC7ecB7Ea93d85A225Be2aCb61aE0738Fbf';
  
  // Escrow ID do último boleto baixado
  const ESCROW_ID = '0x7ad284af4ad3e434d318f7bfc876e7a4bc4c58e0ab73599f218be502f1088f0a';
  
  console.log('🔍 === VERIFICAÇÃO DETALHADA DO ESCROW ===');
  console.log('Escrow ID:', ESCROW_ID);
  console.log('');
  
  // Conectar aos contratos
  const MockUSDT = await ethers.getContractAt('MockUSDT', MOCK_USDT);
  const P2PEscrow = await ethers.getContractAt('P2PEscrow', P2P_ESCROW);
  
  try {
    // 1. Verificar dados do escrow
    const escrowData = await P2PEscrow.escrows(ESCROW_ID);
    console.log('📊 Dados do Escrow:');
    console.log('- Boleto ID:', escrowData[0].toString());
    console.log('- Seller:', escrowData[1]);
    console.log('- Buyer:', escrowData[2]);
    console.log('- Amount:', ethers.formatUnits(escrowData[3], 6), 'USDT');
    console.log('- Fee:', ethers.formatUnits(escrowData[4], 6), 'USDT');
    console.log('- Is Active:', escrowData[5]);
    console.log('- Is Released:', escrowData[6]);
    console.log('');
    
    // 2. Verificar saldos atuais
    const sellerBalance = await MockUSDT.balanceOf(escrowData[1]);
    const buyerBalance = await MockUSDT.balanceOf(escrowData[2]);
    const contractBalance = await MockUSDT.balanceOf(P2P_ESCROW);
    
    console.log('💰 Saldos Atuais:');
    console.log('- Seller:', ethers.formatUnits(sellerBalance, 6), 'USDT');
    console.log('- Buyer:', ethers.formatUnits(buyerBalance, 6), 'USDT');
    console.log('- Contrato P2P:', ethers.formatUnits(contractBalance, 6), 'USDT');
    console.log('');
    
    // 3. Se escrow foi liberado, verificar se as transferências aconteceram
    if (escrowData[6]) { // isReleased = true
      console.log('✅ Escrow foi liberado!');
      console.log('');
      console.log('🎯 ANÁLISE:');
      
      if (buyerBalance > 0) {
        console.log('✅ Buyer recebeu USDT:', ethers.formatUnits(buyerBalance, 6));
      } else {
        console.log('❌ Buyer NÃO recebeu USDT! Saldo ainda é 0');
        console.log('🚨 PROBLEMA: Transfer para buyer pode ter falhado');
      }
      
      const expectedContractBalance = contractBalance;
      console.log('🏦 Saldo do contrato após liberação:', ethers.formatUnits(expectedContractBalance, 6), 'USDT');
      
    } else {
      console.log('❌ Escrow ainda não foi liberado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar escrow:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

