const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MockUSDT contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  // Deploy MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();

  console.log("✅ MockUSDT deployed to:", mockUSDTAddress);

  // Verify the contract
  console.log("🔍 Verifying contract details...");
  
  const name = await mockUSDT.name();
  const symbol = await mockUSDT.symbol();
  const decimals = await mockUSDT.decimals();
  const totalSupply = await mockUSDT.totalSupply();
  const deployerBalance = await mockUSDT.balanceOf(deployer.address);

  console.log("📋 Contract Details:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals.toString());
  console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("  Deployer Balance:", ethers.formatUnits(deployerBalance, decimals), symbol);

  // Save contract address to file
  const fs = require('fs');
  const contractInfo = {
    network: "Polygon Amoy",
    chainId: 80002,
    contractName: "MockUSDT",
    address: mockUSDTAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    details: {
      name: name,
      symbol: symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString(),
      deployerBalance: deployerBalance.toString()
    }
  };

  fs.writeFileSync(
    'deployed-mock-usdt.json', 
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("💾 Contract info saved to deployed-mock-usdt.json");
  console.log("🎉 Deployment completed successfully!");
  
  // Instructions for next steps
  console.log("\n📝 Next Steps:");
  console.log("1. Copy the address:", mockUSDTAddress);
  console.log("2. Update config.js with this address");
  console.log("3. Test the contract on Polygon Amoy");
  console.log("4. Add some USDT to your wallet for testing");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

