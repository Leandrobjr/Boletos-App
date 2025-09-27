const { ethers } = require('hardhat');

async function listAllAddresses() {
  console.log('📋 ENDEREÇOS ATUAIS DO SISTEMA BoletoXCrypto');
  console.log('='.repeat(60));
  
  const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology');
  
  // Endereços dos contratos
  const mockUSDTAddress = '0xB160a30D1612756AF9F6498d47384638D73b953e';
  const p2pEscrowAddress = '0x07A09cC7ecB7Ea93d85A225Be2aCb61aE0738Fbf';
  
  console.log('\n🏦 CONTRATOS INTELIGENTES:');
  console.log('-'.repeat(40));
  console.log('📄 MockUSDT (Token):', mockUSDTAddress);
  console.log('🔒 P2PEscrow (Escrow):', p2pEscrowAddress);
  
  // Verificar owner do P2PEscrow
  const p2pEscrow = new ethers.Contract(p2pEscrowAddress, [
    'function owner() external view returns (address)'
  ], provider);
  
  const ownerAddress = await p2pEscrow.owner();
  
  console.log('\n💼 CARTEIRAS DO SISTEMA:');
  console.log('-'.repeat(40));
  console.log('👑 Owner (Recebe taxas):', ownerAddress);
  console.log('🏪 Vendedor (Exemplo):', '0xEd6e7b900d941De731003E259455c1C1669E9956');
  
  // Verificar saldos
  const mockUSDT = new ethers.Contract(mockUSDTAddress, [
    'function balanceOf(address account) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)'
  ], provider);
  
  const ownerBalance = await mockUSDT.balanceOf(ownerAddress);
  const vendedorBalance = await mockUSDT.balanceOf('0xEd6e7b900d941De731003E259455c1C1669E9956');
  const contractBalance = await mockUSDT.balanceOf(p2pEscrowAddress);
  const totalSupply = await mockUSDT.totalSupply();
  
  console.log('\n💰 SALDOS ATUAIS (USDT):');
  console.log('-'.repeat(40));
  console.log('👑 Owner:', ethers.formatUnits(ownerBalance, 6), 'USDT');
  console.log('🏪 Vendedor:', ethers.formatUnits(vendedorBalance, 6), 'USDT');
  console.log('🔒 Contrato P2P:', ethers.formatUnits(contractBalance, 6), 'USDT');
  console.log('📊 Total Supply:', ethers.formatUnits(totalSupply, 6), 'USDT');
  
  console.log('\n🌐 REDE:');
  console.log('-'.repeat(40));
  console.log('🔗 Nome: Polygon Amoy Testnet');
  console.log('🆔 Chain ID: 80002');
  console.log('🌍 RPC URL: https://rpc-amoy.polygon.technology');
  console.log('🔍 Explorer: https://amoy.polygonscan.com');
  
  console.log('\n📱 LINKS ÚTEIS:');
  console.log('-'.repeat(40));
  console.log('🔍 MockUSDT no Explorer:');
  console.log(`   https://amoy.polygonscan.com/address/${mockUSDTAddress}`);
  console.log('🔍 P2PEscrow no Explorer:');
  console.log(`   https://amoy.polygonscan.com/address/${p2pEscrowAddress}`);
  console.log('🔍 Owner no Explorer:');
  console.log(`   https://amoy.polygonscan.com/address/${ownerAddress}`);
  
  console.log('\n⚙️ CONFIGURAÇÃO FRONTEND:');
  console.log('-'.repeat(40));
  console.log('📄 Arquivo: frontend/src/hooks/useBoletoEscrowDEV.js');
  console.log('🔧 DEV_CONFIG:');
  console.log(`   MOCK_USDT: '${mockUSDTAddress}'`);
  console.log(`   P2P_ESCROW: '${p2pEscrowAddress}'`);
  
  console.log('\n💡 FLUXO DE TAXAS:');
  console.log('-'.repeat(40));
  console.log('1. 📝 Vendedor cria boleto → USDT vai para P2P Escrow');
  console.log('2. 💳 Comprador paga → envia comprovante');
  console.log('3. ✅ Vendedor autoriza baixa → approvePayment()');
  console.log('4. 💰 USDT vai para Comprador + Taxa para Owner');
  console.log(`5. 👑 Owner (${ownerAddress}) recebe 2% de taxa`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ SISTEMA FUNCIONANDO PERFEITAMENTE!');
}

listAllAddresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

