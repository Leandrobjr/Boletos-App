import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying P2PEscrowV2...");

  // Deploy MockUSDT first
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy(ethers.parseUnits("1000000", 6)); // 1M USDT with 6 decimals
  await mockUSDT.waitForDeployment();
  
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("✅ MockUSDT deployed to:", mockUSDTAddress);

  // Deploy P2PEscrowV2
  const P2PEscrowV2 = await ethers.getContractFactory("P2PEscrowV2");
  const p2pEscrowV2 = await P2PEscrowV2.deploy(mockUSDTAddress);
  await p2pEscrowV2.waitForDeployment();
  
  const p2pEscrowV2Address = await p2pEscrowV2.getAddress();
  console.log("✅ P2PEscrowV2 deployed to:", p2pEscrowV2Address);

  // Check deployer balance
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await mockUSDT.balanceOf(deployer.address);
  console.log("🔧 Deployer USDT balance:", ethers.formatUnits(deployerBalance, 6), "USDT");

  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log("======================");
  console.log("MockUSDT:", mockUSDTAddress);
  console.log("P2PEscrowV2:", p2pEscrowV2Address);
  console.log("Deployer:", deployer.address);
  console.log("Network:", await deployer.provider.getNetwork());
  
  console.log("\n🔧 UPDATE YOUR CONFIG:");
  console.log("======================");
  console.log(`MOCK_USDT: '${mockUSDTAddress}',`);
  console.log(`P2P_ESCROW: '${p2pEscrowV2Address}',`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
