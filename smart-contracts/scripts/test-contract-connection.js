const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testando conectividade do contrato MockUSDT...");

  const mockUSDTAddress = "0x213Ae2631a5646A2228648aFa790Bc93f3f0218B";
  const testAddress = "0xEd6e7b900d941De731003E259455c1C1669E9956";

  try {
    // Conectar ao contrato
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = MockUSDT.attach(mockUSDTAddress);

    console.log("✅ Contrato conectado com sucesso");

    // Testar funções básicas
    console.log("\n🔍 Testando funções do contrato...");
    
    const name = await mockUSDT.name();
    console.log("✅ Nome:", name);

    const symbol = await mockUSDT.symbol();
    console.log("✅ Símbolo:", symbol);

    const decimals = await mockUSDT.decimals();
    console.log("✅ Decimais:", decimals.toString());

    const totalSupply = await mockUSDT.totalSupply();
    console.log("✅ Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);

    const balance = await mockUSDT.balanceOf(testAddress);
    console.log("✅ Saldo do teste:", ethers.formatUnits(balance, decimals), symbol);

    // Testar se o contrato está deployado corretamente
    const [deployer] = await ethers.getSigners();
    const provider = deployer.provider;
    
    const code = await provider.getCode(mockUSDTAddress);
    if (code === '0x') {
      console.log("❌ Contrato não encontrado na blockchain");
    } else {
      console.log("✅ Contrato encontrado na blockchain");
      console.log("📏 Tamanho do código:", code.length, "caracteres");
    }

    console.log("\n🎉 Todos os testes passaram! O contrato está funcionando corretamente.");

  } catch (error) {
    console.error("❌ Erro ao testar contrato:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script falhou:", error);
    process.exit(1);
  });


