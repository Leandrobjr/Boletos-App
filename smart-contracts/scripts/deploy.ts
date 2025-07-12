import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 milhão de USDT
  const mockUSDT = await MockUSDT.deploy(initialSupply);
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", mockUSDTAddress);

  // Deploy P2PEscrow
  const P2PEscrow = await ethers.getContractFactory("P2PEscrow");
  const p2pEscrow = await P2PEscrow.deploy(mockUSDTAddress);
  await p2pEscrow.waitForDeployment();
  const p2pEscrowAddress = await p2pEscrow.getAddress();
  console.log("P2PEscrow deployed to:", p2pEscrowAddress);

  // Salvar endereços dos contratos
  const contracts = {
    mockUSDT: mockUSDTAddress,
    p2pEscrow: p2pEscrowAddress,
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployed-contracts.json"),
    JSON.stringify(contracts, null, 2)
  );

  console.log("Contract addresses saved to deployed-contracts.json");

  // Aguardar algumas confirmações antes de verificar
  console.log("Aguardando confirmações antes de verificar os contratos...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Verificar MockUSDT
  console.log("Verificando MockUSDT...");
  try {
    await run("verify:verify", {
      address: mockUSDTAddress,
      constructorArguments: [initialSupply],
    });
    console.log("MockUSDT verificado com sucesso!");
  } catch (error) {
    console.log("Erro ao verificar MockUSDT:", error);
  }

  // Verificar P2PEscrow
  console.log("Verificando P2PEscrow...");
  try {
    await run("verify:verify", {
      address: p2pEscrowAddress,
      constructorArguments: [mockUSDTAddress],
    });
    console.log("P2PEscrow verificado com sucesso!");
  } catch (error) {
    console.log("Erro ao verificar P2PEscrow:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 