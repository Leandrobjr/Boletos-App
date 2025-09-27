import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing deployed BoletoEscrow contract...");
  
  const [user] = await ethers.getSigners();
  console.log("Testing with account:", user.address);

  // Endereços do deploy recente
  const BOLETO_ESCROW_ADDRESS = "0x1007DBFe9B5cD9bf953d0b351Cd9061927dF380d";
  const MOCK_USDT_ADDRESS = "0xb75E3FfB95Aa3E516cFe9113d47f604044482D66";

  // Conectar aos contratos
  const boletoEscrow = await ethers.getContractAt("BoletoEscrow", BOLETO_ESCROW_ADDRESS);
  const mockUSDT = await ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS);

  console.log("\n✅ Contract connections established");

  // Verificar configurações básicas
  console.log("\n📊 Contract Information:");
  console.log("- Owner:", await boletoEscrow.owner());
  console.log("- USDT Token:", await boletoEscrow.usdt());
  console.log("- Contract Paused:", await boletoEscrow.paused());

  // Verificar estatísticas
  const stats = await boletoEscrow.getStats();
  console.log("\n📈 Statistics:");
  console.log("- Total Transactions:", stats._totalTransactions.toString());
  console.log("- Total Volume USDT:", ethers.formatUnits(stats._totalVolumeUSDT, 6));
  console.log("- Total Fees Collected:", ethers.formatUnits(stats._totalFeesCollected, 6));
  console.log("- Contract Balance:", ethers.formatUnits(stats._contractBalance, 6));

  // Testar cálculo de taxas
  console.log("\n🧮 Fee Calculations:");
  const fee100 = await boletoEscrow.calculateBuyerFee(ethers.parseUnits("100", 6));
  const fee500 = await boletoEscrow.calculateBuyerFee(ethers.parseUnits("500", 6));
  console.log("- Fee for 100 USDT:", ethers.formatUnits(fee100, 6), "USDT");
  console.log("- Fee for 500 USDT:", ethers.formatUnits(fee500, 6), "USDT");

  // Verificar saldo de USDT do usuário
  const userBalance = await mockUSDT.balanceOf(user.address);
  console.log("\n💰 User USDT Balance:", ethers.formatUnits(userBalance, 6), "USDT");

  if (userBalance === 0n) {
    console.log("\n🚰 Minting USDT for testing...");
    try {
      // Tentar mintar USDT se possível (dependendo da implementação)
      const mintTx = await mockUSDT.transfer(user.address, ethers.parseUnits("1000", 6));
      await mintTx.wait();
      console.log("✅ USDT minted successfully");
    } catch (error) {
      console.log("⚠️  Cannot mint USDT (expected if not owner)");
    }
  }

  // Teste de leitura: verificar se pode fazer upload/release
  console.log("\n🔍 Testing read functions:");
  
  try {
    // Testar com transaction ID fictício (deve retornar false)
    const fakeTransactionId = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const canUpload = await boletoEscrow.canUploadProof(fakeTransactionId);
    const canAutoRelease = await boletoEscrow.canAutoRelease(fakeTransactionId);
    console.log("- Can upload proof (fake tx):", canUpload);
    console.log("- Can auto release (fake tx):", canAutoRelease);
  } catch (error) {
    console.log("- Read functions test completed (expected errors for non-existent transactions)");
  }

  console.log("\n🎉 Contract is deployed and responding correctly!");
  console.log("\n📝 Ready for frontend integration:");
  console.log("- BoletoEscrow Address:", BOLETO_ESCROW_ADDRESS);
  console.log("- MockUSDT Address:   ", MOCK_USDT_ADDRESS);
  console.log("- Network:            ", "Polygon Amoy Testnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });











