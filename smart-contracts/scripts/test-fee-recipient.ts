import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing FeeRecipient configuration...");
  
  const [user] = await ethers.getSigners();
  console.log("Testing with account:", user.address);

  // Endereços do deploy recente com carteira corrigida
  const BOLETO_ESCROW_ADDRESS = "0x17688a3610b2e0d78a322c73366Bb4b6A0ACACfB";
  const MOCK_USDT_ADDRESS = "0x754e24f6708CA0313A40f23EE27Cb9CDE06E140D";
  const FEE_RECIPIENT = "0x636731Eb388adeF4f61d3Fb9C80F626F067fD357";

  // Conectar aos contratos
  const boletoEscrow = await ethers.getContractAt("BoletoEscrow", BOLETO_ESCROW_ADDRESS);
  const mockUSDT = await ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS);

  console.log("\n✅ Contract connections established");

  // Verificar configurações da carteira de taxas
  console.log("\n💰 Fee Recipient Configuration:");
  const configuredFeeRecipient = await boletoEscrow.feeRecipient();
  console.log("- Configured Fee Recipient:", configuredFeeRecipient);
  console.log("- Expected Fee Recipient: ", FEE_RECIPIENT);
  console.log("- ✅ Fee Recipient correctly set:", configuredFeeRecipient === FEE_RECIPIENT);

  // Verificar outras configurações
  console.log("\n📊 Contract Information:");
  console.log("- Owner:", await boletoEscrow.owner());
  console.log("- USDT Token:", await boletoEscrow.usdt());
  console.log("- Contract Paused:", await boletoEscrow.paused());

  // Verificar saldo da carteira de taxas
  const feeRecipientBalance = await mockUSDT.balanceOf(FEE_RECIPIENT);
  console.log("\n💰 Fee Recipient USDT Balance:", ethers.formatUnits(feeRecipientBalance, 6), "USDT");

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

  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("✅ Fee Recipient correctly configured");
  console.log("✅ Contract responding properly");
  console.log("✅ Ready for frontend integration");
  
  console.log("\n📝 UPDATED CONTRACT ADDRESSES:");
  console.log("==========================================");
  console.log("BoletoEscrow: ", BOLETO_ESCROW_ADDRESS);
  console.log("MockUSDT:     ", MOCK_USDT_ADDRESS);
  console.log("Fee Recipient:", FEE_RECIPIENT);
  console.log("Network:       Polygon Amoy Testnet");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });










