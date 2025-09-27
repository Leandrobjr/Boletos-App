const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Diagnosticando estado do P2PEscrow...");
  
  const CONFIG = {
    MOCK_USDT: '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B',
    P2P_ESCROW: '0x695d8e05BA083A80e677A075438A48B0A0365B6a'
  };
  
  // Conectar aos contratos
  const mockUSDT = await ethers.getContractAt("MockUSDT", CONFIG.MOCK_USDT);
  const p2pEscrow = await ethers.getContractAt("P2PEscrowV2", CONFIG.P2P_ESCROW);
  
  console.log("\n📊 ESTADO DOS CONTRATOS:");
  
  // 1. Verificar saldo do contrato escrow
  const escrowBalance = await mockUSDT.balanceOf(CONFIG.P2P_ESCROW);
  console.log(`💰 Saldo P2PEscrow: ${ethers.formatUnits(escrowBalance, 6)} USDT`);
  
  // 2. Verificar estado do contrato
  const owner = await p2pEscrow.owner();
  const isPaused = await p2pEscrow.paused();
  console.log(`👤 Owner: ${owner}`);
  console.log(`⏸️ Pausado: ${isPaused}`);
  
  // 3. Verificar endereço USDT no contrato
  const usdtAddress = await p2pEscrow.usdt();
  console.log(`🏦 USDT no contrato: ${usdtAddress}`);
  console.log(`🏦 USDT esperado: ${CONFIG.MOCK_USDT}`);
  console.log(`✅ USDT correto: ${usdtAddress.toLowerCase() === CONFIG.MOCK_USDT.toLowerCase()}`);
  
  // 4. Verificar últimas transações
  console.log("\n🔍 INFORMAÇÕES ADICIONAIS:");
  console.log(`📝 Contrato P2PEscrow: ${CONFIG.P2P_ESCROW}`);
  console.log(`🪙 Contrato MockUSDT: ${CONFIG.MOCK_USDT}`);
  
  // 5. Simular createEscrow para entender o erro
  console.log("\n🧪 SIMULANDO createEscrow...");
  
  const [signer] = await ethers.getSigners();
  const userAddress = await signer.getAddress();
  
  const testAmount = ethers.parseUnits("118.16", 6);
  const fee = (testAmount * 200n) / 10000n;
  const totalAmount = testAmount + fee;
  
  console.log(`📊 Simulação:`);
  console.log(`  • Valor base: ${ethers.formatUnits(testAmount, 6)} USDT`);
  console.log(`  • Taxa (2%): ${ethers.formatUnits(fee, 6)} USDT`);
  console.log(`  • Total: ${ethers.formatUnits(totalAmount, 6)} USDT`);
  console.log(`  • Saldo contrato: ${ethers.formatUnits(escrowBalance, 6)} USDT`);
  console.log(`  • Saldo suficiente: ${escrowBalance >= totalAmount}`);
  
  if (escrowBalance < totalAmount) {
    console.log("❌ PROBLEMA: Saldo insuficiente no contrato!");
    console.log(`💡 Diferença: ${ethers.formatUnits(totalAmount - escrowBalance, 6)} USDT`);
  } else {
    console.log("✅ Saldo suficiente encontrado");
    
    // Tentar simular escrow ID
    const boletoId = BigInt(Date.now());
    const escrowId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256"],
        [userAddress, userAddress, boletoId, Math.floor(Date.now() / 1000)]
      )
    );
    
    console.log(`📝 Escrow ID simulado: ${escrowId}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  });







