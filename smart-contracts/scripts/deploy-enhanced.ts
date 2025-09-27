import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Enhanced P2P Escrow with Dynamic Fees...");
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "MATIC");

  // Deploy MockUSDT first (if needed)
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("📄 MockUSDT deployed to:", mockUSDTAddress);

  // Deploy Enhanced P2PEscrow
  const P2PEscrowEnhanced = await ethers.getContractFactory("P2PEscrowEnhanced");
  const p2pEscrowEnhanced = await P2PEscrowEnhanced.deploy(mockUSDTAddress);
  await p2pEscrowEnhanced.waitForDeployment();
  
  const p2pEscrowEnhancedAddress = await p2pEscrowEnhanced.getAddress();
  console.log("🔒 P2PEscrowEnhanced deployed to:", p2pEscrowEnhancedAddress);

  // Transfer ownership to protocol wallet
  const PROTOCOL_WALLET = "0x9950764Ad4548E9106E3106c954a87D8b3CF64a7";
  
  console.log("🔑 Current owner:", await p2pEscrowEnhanced.owner());
  console.log("👑 Transferring ownership to protocol wallet:", PROTOCOL_WALLET);
  
  if (deployer.address.toLowerCase() !== PROTOCOL_WALLET.toLowerCase()) {
    await p2pEscrowEnhanced.transferOwnership(PROTOCOL_WALLET);
    console.log("✅ Ownership transferred successfully!");
  } else {
    console.log("ℹ️  Deployer is already the protocol wallet");
  }

  // Verify contracts on Polygonscan
  console.log("\n🔍 Verifying contracts...");
  
  try {
    await hre.run("verify:verify", {
      address: mockUSDTAddress,
      constructorArguments: []
    });
    console.log("✅ MockUSDT verified");
  } catch (error) {
    console.log("⚠️  MockUSDT verification failed:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: p2pEscrowEnhancedAddress,
      constructorArguments: [mockUSDTAddress]
    });
    console.log("✅ P2PEscrowEnhanced verified");
  } catch (error) {
    console.log("⚠️  P2PEscrowEnhanced verification failed:", error.message);
  }

  // Test fee calculations
  console.log("\n💰 Testing fee calculations...");
  
  // Test case 1: R$ 50 boleto (should use fixed fee)
  const boleto50 = ethers.parseUnits("50", 6); // R$ 50
  const buyerFee50 = await p2pEscrowEnhanced.calculateBuyerFee(boleto50);
  console.log(`📊 Boleto R$ 50.00 - Buyer fee: R$ ${ethers.formatUnits(buyerFee50, 6)} (should be R$ 5.00)`);

  // Test case 2: R$ 500 boleto (should use percentage fee)
  const boleto500 = ethers.parseUnits("500", 6); // R$ 500
  const buyerFee500 = await p2pEscrowEnhanced.calculateBuyerFee(boleto500);
  console.log(`📊 Boleto R$ 500.00 - Buyer fee: R$ ${ethers.formatUnits(buyerFee500, 6)} (should be R$ 20.00)`);

  // Test seller refund calculations
  const originalFee = ethers.parseUnits("10", 6); // R$ 10 original fee
  const createdAt = Math.floor(Date.now() / 1000);
  
  // Within 2 hours - should be 100% refund
  const refund2h = await p2pEscrowEnhanced.calculateSellerRefund(createdAt, createdAt + 1800, originalFee); // 30 min
  console.log(`⏰ Refund after 30min: R$ ${ethers.formatUnits(refund2h, 6)} (should be R$ 10.00 - 100%)`);

  // After 12 hours - should be 50% refund
  const refund12h = await p2pEscrowEnhanced.calculateSellerRefund(createdAt, createdAt + 43200, originalFee); // 12h
  console.log(`⏰ Refund after 12h: R$ ${ethers.formatUnits(refund12h, 6)} (should be R$ 5.00 - 50%)`);

  // After 36 hours - should be 25% refund
  const refund36h = await p2pEscrowEnhanced.calculateSellerRefund(createdAt, createdAt + 129600, originalFee); // 36h
  console.log(`⏰ Refund after 36h: R$ ${ethers.formatUnits(refund36h, 6)} (should be R$ 2.50 - 25%)`);

  // After 50 hours - should be 0% refund
  const refund50h = await p2pEscrowEnhanced.calculateSellerRefund(createdAt, createdAt + 180000, originalFee); // 50h
  console.log(`⏰ Refund after 50h: R$ ${ethers.formatUnits(refund50h, 6)} (should be R$ 0.00 - 0%)`);

  // Summary
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(50));
  console.log("🏦 Network:", hre.network.name);
  console.log("📄 MockUSDT:", mockUSDTAddress);
  console.log("🔒 P2PEscrowEnhanced:", p2pEscrowEnhancedAddress);
  console.log("👑 Protocol Wallet:", PROTOCOL_WALLET);
  console.log("🕐 Deployment Time:", new Date().toISOString());
  
  // Configuration for frontend
  console.log("\n⚙️  FRONTEND CONFIGURATION:");
  console.log("```javascript");
  console.log("const ENHANCED_CONFIG = {");
  console.log(`  MOCK_USDT: '${mockUSDTAddress}',`);
  console.log(`  P2P_ESCROW_ENHANCED: '${p2pEscrowEnhancedAddress}',`);
  console.log(`  PROTOCOL_WALLET: '${PROTOCOL_WALLET}',`);
  console.log(`  NETWORK: '${hre.network.name}',`);
  console.log(`  CHAIN_ID: ${hre.network.config.chainId || 'unknown'}`);
  console.log("};");
  console.log("```");

  console.log("\n✅ Enhanced deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

