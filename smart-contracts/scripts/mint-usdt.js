const { ethers } = require('hardhat');

async function main() {
  // Endereços
  const MOCK_USDT = '0xB160a30D1612756AF9F6498d47384638D73b953e';
  const COMPRADOR = '0x9950764Ad4548E9106E3106c954a87D8b3CF64a7'; // final 64s7
  
  console.log('💰 === ENVIANDO USDT PARA COMPRADOR ===');
  console.log('MockUSDT:', MOCK_USDT);
  console.log('Comprador:', COMPRADOR);
  console.log('');
  
  // Conectar ao contrato MockUSDT
  const MockUSDT = await ethers.getContractAt('MockUSDT', MOCK_USDT);
  
  try {
    // Verificar saldo atual
    const balanceBefore = await MockUSDT.balanceOf(COMPRADOR);
    console.log('💰 Saldo atual do comprador:', ethers.formatUnits(balanceBefore, 6), 'USDT');
    
    // Mint 500,000 USDT para o comprador
    const amount = ethers.parseUnits('500000', 6);
    console.log('🔄 Enviando 500,000 USDT para o comprador...');
    
    const tx = await MockUSDT.mint(COMPRADOR, amount);
    console.log('📤 Transação enviada:', tx.hash);
    
    await tx.wait();
    console.log('✅ Transação confirmada!');
    
    // Verificar saldo após mint
    const balanceAfter = await MockUSDT.balanceOf(COMPRADOR);
    console.log('💰 Novo saldo do comprador:', ethers.formatUnits(balanceAfter, 6), 'USDT');
    
    // Verificar total supply
    const totalSupply = await MockUSDT.totalSupply();
    console.log('📊 Total Supply:', ethers.formatUnits(totalSupply, 6), 'USDT');
    
  } catch (error) {
    console.error('❌ Erro ao enviar USDT:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

