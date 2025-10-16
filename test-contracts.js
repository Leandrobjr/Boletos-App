// Script de teste para validar conectividade com contratos inteligentes
const { ethers } = require('ethers');

// Configuração da rede Amoy
const AMOY_RPC = 'https://rpc-amoy.polygon.technology';
const MOCK_USDT_ADDRESS = '0x754e24f6708CA0313A40f23EE27Cb9CDE06E140D';
const P2P_ESCROW_ADDRESS = '0x17688a3610b2e0d78a322c73366Bb4b6A0ACACfB';

// ABI simplificado para teste
const MOCK_USDT_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

const P2P_ESCROW_ABI = [
  'function usdt() view returns (address)',
  'function escrows(bytes32) view returns (address seller, address buyer, uint256 amount, uint256 fee, uint256 boletoId, bool isActive, bool isReleased)'
];

async function testContractConnectivity() {
  console.log('🧪 TESTANDO CONECTIVIDADE COM CONTRATOS INTELLIGENTES');
  console.log('====================================================');
  
  try {
    // Conectar à rede Amoy
    console.log('🔗 Conectando à rede Polygon Amoy...');
    const provider = new ethers.JsonRpcProvider(AMOY_RPC);
    
    // Verificar conexão
    const network = await provider.getNetwork();
    console.log(`✅ Conectado à rede: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Testar MockUSDT
    console.log('\n🪙 Testando contrato MockUSDT...');
    const mockUSDT = new ethers.Contract(MOCK_USDT_ADDRESS, MOCK_USDT_ABI, provider);
    
    try {
      const name = await mockUSDT.name();
      const symbol = await mockUSDT.symbol();
      const decimals = await mockUSDT.decimals();
      const totalSupply = await mockUSDT.totalSupply();
      
      console.log(`✅ MockUSDT conectado com sucesso!`);
      console.log(`   Nome: ${name}`);
      console.log(`   Símbolo: ${symbol}`);
      console.log(`   Decimais: ${decimals}`);
      console.log(`   Supply Total: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
    } catch (error) {
      console.log(`❌ Erro ao conectar com MockUSDT: ${error.message}`);
    }
    
    // Testar P2PEscrow
    console.log('\n🔒 Testando contrato P2PEscrow...');
    const p2pEscrow = new ethers.Contract(P2P_ESCROW_ADDRESS, P2P_ESCROW_ABI, provider);
    
    try {
      const usdtAddress = await p2pEscrow.usdt();
      console.log(`✅ P2PEscrow conectado com sucesso!`);
      console.log(`   Endereço USDT: ${usdtAddress}`);
      console.log(`   Endereço configurado: ${MOCK_USDT_ADDRESS}`);
      console.log(`   ✅ Endereços coincidem: ${usdtAddress.toLowerCase() === MOCK_USDT_ADDRESS.toLowerCase()}`);
    } catch (error) {
      console.log(`❌ Erro ao conectar com P2PEscrow: ${error.message}`);
    }
    
    // Testar leitura de escrow (deve retornar dados vazios se não houver escrows)
    console.log('\n📖 Testando leitura de escrows...');
    try {
      const testEscrowId = ethers.keccak256(ethers.toUtf8Bytes('test'));
      const escrowData = await p2pEscrow.escrows(testEscrowId);
      console.log(`✅ Leitura de escrow funcionando!`);
      console.log(`   Escrow teste: ${escrowData.isActive ? 'Ativo' : 'Inativo'}`);
    } catch (error) {
      console.log(`❌ Erro ao ler escrow: ${error.message}`);
    }
    
    console.log('\n🎯 TESTE DE CONECTIVIDADE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testContractConnectivity();





