const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Implantando P2PEscrow com MockUSDT correto...");
  
  const MOCK_USDT_CORRETO = '0x213Ae2631a5646A2228648aFa790Bc93f3f0218B';
  
  // Deploy do P2PEscrowV2 com endereço correto
  const P2PEscrowV2 = await ethers.getContractFactory("P2PEscrowV2");
  console.log("📝 Implantando P2PEscrowV2...");
  
  const p2pEscrow = await P2PEscrowV2.deploy(MOCK_USDT_CORRETO);
  await p2pEscrow.waitForDeployment();
  
  const escrowAddress = await p2pEscrow.getAddress();
  console.log(`✅ P2PEscrowV2 implantado em: ${escrowAddress}`);
  
  // Verificar se está correto
  const usdtConfigured = await p2pEscrow.usdt();
  console.log(`🏦 USDT configurado: ${usdtConfigured}`);
  console.log(`✅ Endereço correto: ${usdtConfigured === MOCK_USDT_CORRETO}`);
  
  // Verificar owner
  const owner = await p2pEscrow.owner();
  console.log(`👤 Owner: ${owner}`);
  
  console.log("\n🔧 ATUALIZE O CONFIG.JS COM:");
  console.log(`P2P_ESCROW: '${escrowAddress}'`);
  
  return {
    escrowAddress,
    mockUSDT: MOCK_USDT_CORRETO
  };
}

main()
  .then((result) => {
    console.log("\n✅ Implantação concluída com sucesso!");
    console.log("📝 Resultado:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na implantação:", error);
    process.exit(1);
  });







