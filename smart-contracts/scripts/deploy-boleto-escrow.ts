import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying BoletoEscrow with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy MockUSDT primeiro (para testes)
  console.log("\n📦 Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 milhão de USDT
  const mockUSDT = await MockUSDT.deploy(initialSupply);
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("✅ MockUSDT deployed to:", mockUSDTAddress);

  // Deploy BoletoEscrow
  console.log("\n🏗️  Deploying BoletoEscrow...");
  const FEE_RECIPIENT = "0x636731Eb388adeF4f61d3Fb9C80F626F067fD357"; // Carteira da aplicação
  const BoletoEscrow = await ethers.getContractFactory("BoletoEscrow");
  const boletoEscrow = await BoletoEscrow.deploy(mockUSDTAddress, FEE_RECIPIENT);
  await boletoEscrow.waitForDeployment();
  const boletoEscrowAddress = await boletoEscrow.getAddress();
  console.log("✅ BoletoEscrow deployed to:", boletoEscrowAddress);
  console.log("💰 Fee Recipient set to:", FEE_RECIPIENT);

  // Salvar endereços dos contratos
  const contracts = {
    mockUSDT: mockUSDTAddress,
    boletoEscrow: boletoEscrowAddress,
    deployedAt: new Date().toISOString(),
    network: "amoy",
    deployer: deployer.address
  };

  const contractsPath = path.join(__dirname, "../deployed-contracts-new.json");
  fs.writeFileSync(contractsPath, JSON.stringify(contracts, null, 2));
  console.log("💾 Contract addresses saved to deployed-contracts-new.json");

  // Mostrar estatísticas do contrato
  console.log("\n📊 Contract Statistics:");
  const stats = await boletoEscrow.getStats();
  console.log("- Total Transactions:", stats._totalTransactions.toString());
  console.log("- Total Volume USDT:", stats._totalVolumeUSDT.toString());
  console.log("- Total Fees Collected:", stats._totalFeesCollected.toString());
  console.log("- Contract Balance:", stats._contractBalance.toString());

  // Mostrar constantes importantes
  console.log("\n⚙️  Contract Configuration:");
  console.log("- USDT Token:", await boletoEscrow.usdt());
  console.log("- Owner:", await boletoEscrow.owner());
  
  // Testar função de cálculo de taxa
  console.log("\n🧮 Fee Calculation Tests:");
  const fee50 = await boletoEscrow.calculateBuyerFee(ethers.parseUnits("50", 6));
  const fee500 = await boletoEscrow.calculateBuyerFee(ethers.parseUnits("500", 6));
  console.log("- Fee for 50 USDT:", ethers.formatUnits(fee50, 6), "USDT");
  console.log("- Fee for 500 USDT:", ethers.formatUnits(fee500, 6), "USDT");

  console.log("\n⏳ Waiting for confirmations before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos

  // Verificar MockUSDT
  console.log("\n🔍 Verifying MockUSDT...");
  try {
    await run("verify:verify", {
      address: mockUSDTAddress,
      constructorArguments: [initialSupply],
    });
    console.log("✅ MockUSDT verified successfully!");
  } catch (error) {
    console.log("❌ Error verifying MockUSDT:", error);
  }

  // Verificar BoletoEscrow
  console.log("\n🔍 Verifying BoletoEscrow...");
  try {
    await run("verify:verify", {
      address: boletoEscrowAddress,
      constructorArguments: [mockUSDTAddress, FEE_RECIPIENT],
    });
    console.log("✅ BoletoEscrow verified successfully!");
  } catch (error) {
    console.log("❌ Error verifying BoletoEscrow:", error);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Summary:");
  console.log("==========================================");
  console.log("MockUSDT Address:    ", mockUSDTAddress);
  console.log("BoletoEscrow Address:", boletoEscrowAddress);
  console.log("Network:             ", "Polygon Amoy Testnet");
  console.log("Deployer:            ", deployer.address);
  console.log("Gas Used:            ", "Check transaction receipts");
  console.log("==========================================");
  
  console.log("\n📝 Next Steps:");
  console.log("1. Update frontend escrowService.js with new addresses");
  console.log("2. Test all functionalities on testnet");
  console.log("3. Prepare for production deployment");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });

