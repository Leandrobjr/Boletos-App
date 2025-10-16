const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 VERIFICANDO FLUXO DE USDT");
    console.log("");

    // Configurações
    const MOCK_USDT_ADDRESS = "0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD";
    const P2P_ESCROW_ADDRESS = "0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2";
    
    const VENDEDOR_ADDRESS = "0x9950764Ad4548E9106E3106c954a87D8b3CF64a7";
    const COMPRADOR_ADDRESS = "0x9F40995deC03533aC9430e0aac7D755A80c8BCD6";
    
    // Conectar aos contratos
    const mockUSDT = await ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS);
    const escrow = await ethers.getContractAt("P2PEscrowEnhanced", P2P_ESCROW_ADDRESS);
    
    console.log("📊 SALDOS ATUAIS:");
    
    // Verificar saldos
    const vendedorBalance = await mockUSDT.balanceOf(VENDEDOR_ADDRESS);
    const compradorBalance = await mockUSDT.balanceOf(COMPRADOR_ADDRESS);
    const escrowBalance = await mockUSDT.balanceOf(P2P_ESCROW_ADDRESS);
    
    console.log(`Vendedor (${VENDEDOR_ADDRESS}): ${ethers.formatUnits(vendedorBalance, 6)} USDT`);
    console.log(`Comprador (${COMPRADOR_ADDRESS}): ${ethers.formatUnits(compradorBalance, 6)} USDT`);
    console.log(`Contrato Escrow: ${ethers.formatUnits(escrowBalance, 6)} USDT`);
    console.log("");
    
    // Verificar último escrow criado
    const escrowId = "0x4e51df397a6ff2e1d48cb3594cf25a6ebba74e5f53ead9e109b47c7955fb6891";
    
    try {
        const escrowDetails = await escrow.getEscrowDetails(escrowId);
        console.log("🔍 DETALHES DO ESCROW:");
        console.log("Escrow ID:", escrowId);
        console.log("Seller:", escrowDetails.seller);
        console.log("Buyer:", escrowDetails.buyer);
        console.log("Valor Boleto:", ethers.formatUnits(escrowDetails.boletoValue, 6), "USDT");
        console.log("Taxa Vendedor:", ethers.formatUnits(escrowDetails.sellerFee, 6), "USDT");
        console.log("Taxa Comprador:", ethers.formatUnits(escrowDetails.buyerFee, 6), "USDT");
        console.log("Ativo:", escrowDetails.isActive);
        console.log("Liberado:", escrowDetails.isReleased);
        console.log("Status:", escrowDetails.status);
    } catch (error) {
        console.log("❌ Erro ao buscar escrow:", error.message);
    }
    
    console.log("");
    console.log("🧐 ANÁLISE:");
    console.log("- Vendedor deveria ter saldo reduzido ao criar escrow");
    console.log("- USDT deveria estar no contrato escrow");
    console.log("- Comprador recebe quando escrow é liberado");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
