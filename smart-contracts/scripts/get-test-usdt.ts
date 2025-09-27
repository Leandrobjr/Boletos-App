import { ethers } from "hardhat";

async function main() {
  console.log("💰 Obtendo USDT de teste para testes manuais...");
  
  const [user] = await ethers.getSigners();
  console.log("Usuário:", user.address);

  // Endereços dos contratos
  const MOCK_USDT_ADDRESS = "0x754e24f6708CA0313A40f23EE27Cb9CDE06E140D";
  const BOLETO_ESCROW_ADDRESS = "0x17688a3610b2e0d78a322c73366Bb4b6A0ACACfB";

  // Conectar ao MockUSDT
  const mockUSDT = await ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS);
  
  // Verificar saldo atual
  const balanceBefore = await mockUSDT.balanceOf(user.address);
  console.log("\n💰 Saldo atual de USDT:", ethers.formatUnits(balanceBefore, 6), "USDT");

  // Quantidade para mint (10.000 USDT)
  const amountToMint = ethers.parseUnits("10000", 6);
  
  try {
    // Transferir USDT da conta deployer para o usuário
    console.log("\n🔄 Transferindo 10.000 USDT...");
    const tx = await mockUSDT.transfer(user.address, amountToMint);
    await tx.wait();
    
    console.log("✅ USDT transferido com sucesso!");
    console.log("📝 Transaction hash:", tx.hash);
    
    // Verificar saldo final
    const balanceAfter = await mockUSDT.balanceOf(user.address);
    console.log("\n💰 Novo saldo de USDT:", ethers.formatUnits(balanceAfter, 6), "USDT");
    
    // Verificar se pode aprovar o contrato
    console.log("\n🔐 Testando aprovação do contrato...");
    const approveAmount = ethers.parseUnits("1000", 6); // 1000 USDT para teste
    const approveTx = await mockUSDT.approve(BOLETO_ESCROW_ADDRESS, approveAmount);
    await approveTx.wait();
    
    console.log("✅ Aprovação realizada com sucesso!");
    console.log("📝 Aprovação hash:", approveTx.hash);
    
    // Verificar allowance
    const allowance = await mockUSDT.allowance(user.address, BOLETO_ESCROW_ADDRESS);
    console.log("🔐 Allowance para BoletoEscrow:", ethers.formatUnits(allowance, 6), "USDT");
    
    console.log("\n🎉 USUÁRIO PRONTO PARA TESTES!");
    console.log("==========================================");
    console.log("Endereço do usuário:", user.address);
    console.log("Saldo USDT:", ethers.formatUnits(balanceAfter, 6), "USDT");
    console.log("Allowance:", ethers.formatUnits(allowance, 6), "USDT");
    console.log("==========================================");
    
     } catch (error) {
     console.error("❌ Erro ao transferir USDT:", error);
     
     // Verificar saldo da conta deployer
     const deployerBalance = await mockUSDT.balanceOf(user.address);
     console.log("\n💰 Saldo da conta deployer:", ethers.formatUnits(deployerBalance, 6), "USDT");
     
     if (deployerBalance < amountToMint) {
       console.log("\n⚠️  Saldo insuficiente para transferir!");
       console.log("💡 Soluções:");
       console.log("1. Transferir quantidade menor");
       console.log("2. Verificar se a conta tem USDT suficiente");
     }
   }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script falhou:", error);
    process.exit(1);
  });
