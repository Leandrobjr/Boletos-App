// Teste de debug para identificar o erro no upload de comprovante
const { Pool } = require('pg');

// Configuração do banco (usando as mesmas variáveis do projeto)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xxxxxxx@ep-xxxxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function testUploadLogic() {
  console.log('🧪 [DEBUG] Iniciando teste de upload...');
  
  // Teste com diferentes tipos de boleto_id
  const testCases = [
    { id: '1758923258778', type: 'numeric' },
    { id: '550e8400-e29b-41d4-a716-446655440000', type: 'uuid' },
    { id: '1758923258757', type: 'numero_controle' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 [DEBUG] Testando ${testCase.type}: ${testCase.id}`);
    
    try {
      // Verificar se boleto_id parece ser um UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(testCase.id);
      const isNumeric = /^\d+$/.test(testCase.id);
      
      console.log(`   isUUID: ${isUUID}, isNumeric: ${isNumeric}`);
      
      let boletoQuery;
      
      if (isUUID) {
        console.log('   Executando query UUID...');
        boletoQuery = await pool.query(
          'SELECT numero_controle, status FROM boletos WHERE id = $1',
          [testCase.id]
        );
      } else if (isNumeric) {
        console.log('   Executando query numérica...');
        boletoQuery = await pool.query(
          'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1 OR (id::text = $1)',
          [testCase.id]
        );
      } else {
        console.log('   Executando query numero_controle...');
        boletoQuery = await pool.query(
          'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1',
          [testCase.id]
        );
      }
      
      console.log(`   Resultado: ${boletoQuery.rows.length} boletos encontrados`);
      if (boletoQuery.rows.length > 0) {
        console.log(`   Boleto: ${JSON.stringify(boletoQuery.rows[0])}`);
      }
      
    } catch (error) {
      console.error(`❌ [DEBUG] Erro no teste ${testCase.type}:`, error.message);
      console.error(`❌ [DEBUG] Error code:`, error.code);
      console.error(`❌ [DEBUG] Error detail:`, error.detail);
    }
  }
  
  await pool.end();
  console.log('\n✅ [DEBUG] Teste concluído');
}

testUploadLogic().catch(console.error);