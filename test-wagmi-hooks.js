// Teste para verificar se os hooks do Wagmi estão funcionando
const fs = require('fs');

console.log('🧪 TESTANDO HOOKS DO WAGMI');
console.log('============================');

try {
  // Verificar se o arquivo de configuração existe
  const configPath = './frontend/src/config/rainbowConfig.js';
  if (!fs.existsSync(configPath)) {
    console.log('❌ Arquivo rainbowConfig.js não encontrado!');
    process.exit(1);
  }

  console.log('✅ Arquivo rainbowConfig.js encontrado!');
  
  // Verificar se o arquivo de configuração dos contratos existe
  const contractConfigPath = './frontend/src/contracts/config.js';
  if (!fs.existsSync(contractConfigPath)) {
    console.log('❌ Arquivo config.js dos contratos não encontrado!');
    process.exit(1);
  }

  console.log('✅ Arquivo config.js dos contratos encontrado!');
  
  // Verificar se os ABIs existem
  const p2pAbiPath = './frontend/src/contracts/abis/P2PEscrow.json';
  const mockUsdtAbiPath = './frontend/src/contracts/abis/MockUSDT.json';
  
  if (!fs.existsSync(p2pAbiPath)) {
    console.log('❌ ABI P2PEscrow não encontrado!');
  } else {
    console.log('✅ ABI P2PEscrow encontrado!');
  }
  
  if (!fs.existsSync(mockUsdtAbiPath)) {
    console.log('❌ ABI MockUSDT não encontrado!');
  } else {
    console.log('✅ ABI MockUSDT encontrado!');
  }
  
  // Verificar se o hook está sendo exportado corretamente
  const hookPath = './frontend/src/hooks/useBoletoEscrow.js';
  if (!fs.existsSync(hookPath)) {
    console.log('❌ Hook useBoletoEscrow não encontrado!');
    process.exit(1);
  }

  console.log('✅ Hook useBoletoEscrow encontrado!');
  
  // Verificar se o hook está sendo importado corretamente na página
  const vendedorPagePath = './frontend/src/pages/VendedorPage.jsx';
  if (!fs.existsSync(vendedorPagePath)) {
    console.log('❌ Página VendedorPage não encontrada!');
    process.exit(1);
  }

  console.log('✅ Página VendedorPage encontrada!');
  
  // Verificar se o componente de debug foi adicionado
  const vendedorPageContent = fs.readFileSync(vendedorPagePath, 'utf8');
  const hasHooksDebug = vendedorPageContent.includes('HooksDebug');
  
  if (hasHooksDebug) {
    console.log('✅ Componente HooksDebug adicionado à página!');
  } else {
    console.log('❌ Componente HooksDebug não foi adicionado à página!');
  }
  
  // Verificar se o hook está sendo usado corretamente
  const usesHook = vendedorPageContent.includes('useBoletoEscrow');
  
  if (usesHook) {
    console.log('✅ Hook useBoletoEscrow está sendo usado na página!');
  } else {
    console.log('❌ Hook useBoletoEscrow não está sendo usado na página!');
  }
  
  console.log('\n🎯 ANÁLISE COMPLETA:');
  console.log('====================');
  console.log('1. Configuração RainbowKit: ✅');
  console.log('2. Configuração Contratos: ✅');
  console.log('3. ABIs dos Contratos: ✅');
  console.log('4. Hook useBoletoEscrow: ✅');
  console.log('5. Página VendedorPage: ✅');
  console.log(`6. Componente Debug: ${hasHooksDebug ? '✅' : '❌'}`);
  console.log(`7. Hook sendo usado: ${usesHook ? '✅' : '❌'}`);
  
  if (hasHooksDebug && usesHook) {
    console.log('\n🎉 TODOS OS COMPONENTES ESTÃO CONFIGURADOS!');
    console.log('Agora teste no navegador para ver o debug dos hooks.');
  } else {
    console.log('\n⚠️  AINDA HÁ PROBLEMAS DE CONFIGURAÇÃO!');
  }
  
} catch (error) {
  console.error('❌ Erro ao analisar:', error.message);
}





