import { ethers } from "hardhat";

async function main() {
  console.log("💰 Transferindo MockUSDT para carteira de teste...");
  
  // Endereços
  const MOCK_USDT_ADDRESS = "0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD";
  const TARGET_ADDRESS = "0x9950764ad4548e9106e3106c954a87d8b3cf64a7";
  const AMOUNT_TO_TRANSFER = "10000"; // 10,000 USDT
  
  // Get deployer (que tem os tokens)
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Transferindo de:", deployer.address);
  console.log("🎯 Para:", TARGET_ADDRESS);
  console.log("💵 Quantidade:", AMOUNT_TO_TRANSFER, "USDT");
  
  // Conectar ao contrato MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = MockUSDT.attach(MOCK_USDT_ADDRESS);
  
  // Verificar saldo do deployer
  const deployerBalance = await mockUSDT.balanceOf(deployer.address);
  console.log("💰 Saldo do deployer:", ethers.formatUnits(deployerBalance, 6), "USDT");
  
  // Verificar saldo atual do target
  const currentBalance = await mockUSDT.balanceOf(TARGET_ADDRESS);
  console.log("💰 Saldo atual do target:", ethers.formatUnits(currentBalance, 6), "USDT");
  
  // Converter quantidade para Wei (6 decimais para USDT)
  const amountInWei = ethers.parseUnits(AMOUNT_TO_TRANSFER, 6);
  
  if (deployerBalance < amountInWei) {
    console.log("❌ Saldo insuficiente do deployer. Mintando mais tokens...");
    
    // Mint mais tokens para o deployer
    const mintTx = await mockUSDT.mint(deployer.address, ethers.parseUnits("20000", 6));
    await mintTx.wait();
    console.log("✅ Tokens mintados para o deployer");
    
    const newBalance = await mockUSDT.balanceOf(deployer.address);
    console.log("💰 Novo saldo do deployer:", ethers.formatUnits(newBalance, 6), "USDT");
  }
  
  // Transferir tokens
  console.log("🚀 Iniciando transferência...");
  const transferTx = await mockUSDT.transfer(TARGET_ADDRESS, amountInWei);
  
  console.log("⏳ Aguardando confirmação da transação...");
  const receipt = await transferTx.wait();
  
  console.log("✅ Transferência concluída!");
  console.log("📝 Hash da transação:", transferTx.hash);
  console.log("🔗 Explorer:", `https://amoy.polygonscan.com/tx/${transferTx.hash}`);
  
  // Verificar saldo final
  const finalBalance = await mockUSDT.balanceOf(TARGET_ADDRESS);
  console.log("💰 Saldo final do target:", ethers.formatUnits(finalBalance, 6), "USDT");
  
  console.log("\n🎉 TRANSFERÊNCIA CONCLUÍDA COM SUCESSO!");
  console.log("🎯 Agora você pode criar boletos na aplicação!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro na transferência:", error);
    process.exit(1);
  });