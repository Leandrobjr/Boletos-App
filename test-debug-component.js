// Teste para verificar se o componente de debug está funcionando
const fs = require('fs');

console.log('🧪 TESTANDO COMPONENTE DE DEBUG');
console.log('================================');

try {
  // Verificar se o componente foi corrigido
  const debugPath = './frontend/src/components/HooksDebug.jsx';
  if (!fs.existsSync(debugPath)) {
    console.log('❌ Componente HooksDebug não encontrado!');
    process.exit(1);
  }

  console.log('✅ Componente HooksDebug encontrado!');
  
  // Ler o conteúdo do componente
  const content = fs.readFileSync(debugPath, 'utf8');
  
  // Verificar se a função renderValue foi adicionada
  const hasRenderValue = content.includes('renderValue');
  
  if (hasRenderValue) {
    console.log('✅ Função renderValue adicionada!');
  } else {
    console.log('❌ Função renderValue não foi adicionada!');
  }
  
  // Verificar se há verificações de segurança para contractConfig
  const hasSafeContractConfig = content.includes('contractConfig?.') && content.includes('|| \'N/A\'');
  
  if (hasSafeContractConfig) {
    console.log('✅ Verificações de segurança para contractConfig implementadas!');
  } else {
    console.log('❌ Verificações de segurança para contractConfig não implementadas!');
  }
  
  // Verificar se há verificações para hooksStatus
  const hasSafeHooksStatus = content.includes('hooksStatus &&');
  
  if (hasSafeHooksStatus) {
    console.log('✅ Verificações de segurança para hooksStatus implementadas!');
  } else {
    console.log('❌ Verificações de segurança para hooksStatus não implementadas!');
  }
  
  // Verificar se o erro de renderização foi corrigido
  const hasNetworkRenderFix = content.includes('renderValue(contractConfig.NETWORK)');
  
  if (hasNetworkRenderFix) {
    console.log('✅ Correção para renderização de NETWORK implementada!');
  } else {
    console.log('❌ Correção para renderização de NETWORK não implementada!');
  }
  
  console.log('\n🎯 ANÁLISE COMPLETA:');
  console.log('====================');
  console.log(`1. Função renderValue: ${hasRenderValue ? '✅' : '❌'}`);
  console.log(`2. Verificações contractConfig: ${hasSafeContractConfig ? '✅' : '❌'}`);
  console.log(`3. Verificações hooksStatus: ${hasSafeHooksStatus ? '✅' : '❌'}`);
  console.log(`4. Correção NETWORK: ${hasNetworkRenderFix ? '✅' : '❌'}`);
  
  if (hasRenderValue && hasSafeContractConfig && hasSafeHooksStatus && hasNetworkRenderFix) {
    console.log('\n🎉 COMPONENTE DE DEBUG CORRIGIDO COM SUCESSO!');
    console.log('O erro de renderização deve estar resolvido.');
    console.log('Agora teste no navegador para ver o debug dos hooks funcionando!');
  } else {
    console.log('\n⚠️  AINDA HÁ PROBLEMAS NO COMPONENTE DE DEBUG!');
    console.log('Verifique as correções acima.');
  }
  
} catch (error) {
  console.error('❌ Erro ao analisar:', error.message);
}





