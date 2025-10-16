// Teste para validar se a correção do hook funcionou
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTANDO CORREÇÃO DO HOOK useBoletoEscrow');
console.log('============================================');

try {
  // Verificar se o arquivo existe
  const hookPath = './frontend/src/hooks/useBoletoEscrow.js';
  
  if (!fs.existsSync(hookPath)) {
    console.log('❌ Arquivo useBoletoEscrow.js não encontrado!');
    process.exit(1);
  }

  console.log('✅ Arquivo encontrado!');
  
  // Ler o conteúdo do arquivo
  const content = fs.readFileSync(hookPath, 'utf8');
  
  // Verificar se os hooks estão no nível superior
  const hooksAtTopLevel = content.includes('// Hooks para contratos (nível superior)');
  
  if (hooksAtTopLevel) {
    console.log('✅ Hooks movidos para o nível superior!');
  } else {
    console.log('❌ Hooks ainda não estão no nível superior!');
  }
  
  // Verificar se useContractWrite está sendo usado corretamente (nova estrutura)
  const useContractWriteAtTop = content.includes('const approveUSDTWrite = useContractWrite({');
  const useContractWriteInFunction = content.includes('useContractWrite({') && 
                                    content.includes('// Primeiro, aprovar o gasto de USDT');
  
  if (useContractWriteAtTop && !useContractWriteInFunction) {
    console.log('✅ useContractWrite movido para o nível superior!');
  } else {
    console.log('❌ useContractWrite ainda está sendo usado dentro das funções!');
  }
  
  // Verificar se as funções estão usando os hooks corretamente (nova estrutura)
  const approveUSDTUsage = content.includes('await approveUSDTWrite.writeAsync({');
  const createEscrowUsage = content.includes('await createEscrowWrite.writeAsync({');
  
  if (approveUSDTUsage && createEscrowUsage) {
    console.log('✅ Funções usando hooks corretamente!');
  } else {
    console.log('❌ Funções não estão usando hooks corretamente!');
  }
  
  // Verificar se não há hooks aninhados (apenas useContractWrite)
  const useContractWriteCount = (content.match(/useContractWrite/g) || []).length;
  const useContractReadCount = (content.match(/useContractRead/g) || []).length;
  
  if (useContractWriteCount <= 4) { // 4 hooks no nível superior
    console.log('✅ Número correto de useContractWrite (4 no nível superior)!');
  } else {
    console.log(`❌ Muitos useContractWrite detectados (${useContractWriteCount}) - pode haver hooks aninhados!`);
  }
  
  console.log(`   useContractWrite: ${useContractWriteCount}`);
  console.log(`   useContractRead: ${useContractReadCount}`);
  
  // Verificar se há verificações de segurança
  const hasSafetyChecks = content.includes('!approveUSDTWrite.writeAsync') && 
                         content.includes('Hooks de contrato não estão prontos');
  
  if (hasSafetyChecks) {
    console.log('✅ Verificações de segurança implementadas!');
  } else {
    console.log('❌ Verificações de segurança não implementadas!');
  }
  
  console.log('\n🎯 ANÁLISE COMPLETA:');
  console.log('====================');
  console.log(`1. Arquivo existe: ${fs.existsSync(hookPath) ? '✅' : '❌'}`);
  console.log(`2. Hooks no nível superior: ${hooksAtTopLevel ? '✅' : '❌'}`);
  console.log(`3. useContractWrite movido: ${useContractWriteAtTop && !useContractWriteInFunction ? '✅' : '❌'}`);
  console.log(`4. Funções usando hooks: ${approveUSDTUsage && createEscrowUsage ? '✅' : '❌'}`);
  console.log(`5. Número de useContractWrite: ${useContractWriteCount <= 4 ? '✅' : '❌'} (${useContractWriteCount})`);
  console.log(`6. Verificações de segurança: ${hasSafetyChecks ? '✅' : '❌'}`);
  
  if (hooksAtTopLevel && useContractWriteAtTop && !useContractWriteInFunction && 
      approveUSDTUsage && createEscrowUsage && useContractWriteCount <= 4 && hasSafetyChecks) {
    console.log('\n🎉 HOOK CORRIGIDO COM SUCESSO!');
    console.log('O erro "Invalid hook call" deve estar resolvido.');
    console.log('O erro "approveUSDT is not a function" deve estar resolvido.');
  } else {
    console.log('\n⚠️  AINDA HÁ PROBLEMAS NO HOOK!');
    console.log('Verifique as correções acima.');
  }
  
} catch (error) {
  console.error('❌ Erro ao analisar o hook:', error.message);
}
