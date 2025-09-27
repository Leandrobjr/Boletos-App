import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing MockUSDT approve function...");
  
  const [user] = await ethers.getSigners();
  console.log("Testing with account:", user.address);

  // Endereços dos contratos
  const MOCK_USDT_ADDRESS = "0xb75E3FfB95Aa3E516cFe9113d47f604044482D66";
  const P2P_ESCROW_ADDRESS = "0x1007DBFe9B5cD9bf953d0b351Cd9061927dF380d";

  // Conectar aos contratos
  const mockUSDT = await ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS);
  const p2pEscrow = await ethers.getContractAt("BoletoEscrow", P2P_ESCROW_ADDRESS);

  console.log("\n✅ Contract connections established");

  // Verificar saldo
  const balance = await mockUSDT.balanceOf(user.address);
  console.log("💰 User USDT Balance:", ethers.formatUnits(balance, 6));

  // Verificar allowance atual
  const currentAllowance = await mockUSDT.allowance(user.address, P2P_ESCROW_ADDRESS);
  console.log("🔍 Current Allowance:", ethers.formatUnits(currentAllowance, 6));

  // Testar approve com valor pequeno primeiro
  const testAmount = ethers.parseUnits("1", 6); // 1 USDT
  console.log("\n🔄 Testing approve with 1 USDT...");
  
  try {
    const tx = await mockUSDT.approve(P2P_ESCROW_ADDRESS, testAmount);
    console.log("✅ Approve transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Approve confirmed:", receipt?.hash);
    
    // Verificar novo allowance
    const newAllowance = await mockUSDT.allowance(user.address, P2P_ESCROW_ADDRESS);
    console.log("🔍 New Allowance:", ethers.formatUnits(newAllowance, 6));
    
  } catch (error) {
    console.error("❌ Approve failed:", error);
  }

  // Testar approve com valor maior (123.328200 USDT)
  const largeAmount = ethers.parseUnits("123.328200", 6);
  console.log("\n🔄 Testing approve with 123.328200 USDT...");
  
  try {
    const tx = await mockUSDT.approve(P2P_ESCROW_ADDRESS, largeAmount);
    console.log("✅ Approve transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Approve confirmed:", receipt?.hash);
    
    // Verificar novo allowance
    const newAllowance = await mockUSDT.allowance(user.address, P2P_ESCROW_ADDRESS);
    console.log("🔍 New Allowance:", ethers.formatUnits(newAllowance, 6));
    
  } catch (error) {
    console.error("❌ Approve failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });







