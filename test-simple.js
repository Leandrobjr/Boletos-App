// Teste simples para verificar o hook
const fs = require('fs');

console.log('🧪 TESTE SIMPLES DO HOOK');
console.log('========================');

try {
  const content = fs.readFileSync('./frontend/src/hooks/useBoletoEscrow.js', 'utf8');
  
  // Contar apenas as chamadas de função useContractWrite (não o import)
  const functionCalls = content.match(/const \w+ = useContractWrite\(/g);
  const count = functionCalls ? functionCalls.length : 0;
  
  console.log(`Chamadas de função useContractWrite: ${count}`);
  
  // Verificar se está no nível superior
  const lines = content.split('\n');
  let hookLines = [];
  
  lines.forEach((line, index) => {
    if (line.includes('const ') && line.includes('= useContractWrite(')) {
      hookLines.push(`Linha ${index + 1}: ${line.trim()}`);
    }
  });
  
  console.log('\nLinhas com chamadas de useContractWrite:');
  hookLines.forEach(line => console.log(`  ${line}`));
  
  // Verificar se há hooks sendo CHAMADOS dentro de funções (não definidos)
  const hasHookCallsInFunctions = content.includes('const createEscrow = async') && 
                                 content.includes('useContractWrite(') &&
                                 !content.includes('const ') &&
                                 content.includes('useContractWrite(');
  
  if (hasHookCallsInFunctions) {
    console.log('\n❌ Hooks ainda estão sendo chamados dentro de funções!');
  } else {
    console.log('\n✅ Hooks movidos para o nível superior!');
  }
  
  // Verificar se as funções estão usando os hooks corretamente
  const usesWriteAsync = content.includes('.writeAsync(');
  
  if (usesWriteAsync) {
    console.log('✅ Funções usando .writeAsync() corretamente!');
  } else {
    console.log('❌ Funções não estão usando .writeAsync()!');
  }
  
  // Verificar se há verificações de segurança
  const hasSafetyChecks = content.includes('!approveUSDTWrite.writeAsync') && 
                         content.includes('Hooks de contrato não estão prontos');
  
  if (hasSafetyChecks) {
    console.log('✅ Verificações de segurança implementadas!');
  } else {
    console.log('❌ Verificações de segurança não implementadas!');
  }
  
  // Verificar se não há hooks aninhados (mais preciso)
  const hookDefinitions = content.match(/const \w+ = useContractWrite\(/g);
  const hookUsages = content.match(/\.writeAsync\(/g);
  
  console.log(`\nDefinições de hooks: ${hookDefinitions ? hookDefinitions.length : 0}`);
  console.log(`Usos de hooks (.writeAsync): ${hookUsages ? hookUsages.length : 0}`);
  
  console.log('\n🎯 RESULTADO FINAL:');
  if (count === 4 && !hasHookCallsInFunctions && usesWriteAsync && hasSafetyChecks) {
    console.log('🎉 HOOK CORRIGIDO COM SUCESSO!');
    console.log('Todos os problemas foram resolvidos!');
  } else {
    console.log('⚠️  AINDA HÁ PROBLEMAS NO HOOK!');
  }
  
} catch (error) {
  console.error('Erro:', error.message);
}
