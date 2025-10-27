// Teste real do upload de comprovante para identificar o erro
const { Pool } = require('pg');

// Configuração do banco (mesma do upload-comprovante.js)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testRealUpload() {
  console.log('🧪 [TEST] Iniciando teste real de upload...');
  
  try {
    // Usar um boleto_id que sabemos que existe (do log do servidor)
    const boleto_id = '1758923258778'; // ID numérico que vimos nos logs
    
    console.log(`🔍 [TEST] Testando com boleto_id: ${boleto_id}`);
    
    // Verificar se boleto_id parece ser um UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(boleto_id);
    const isNumeric = /^\d+$/.test(boleto_id);
    
    console.log(`   isUUID: ${isUUID}, isNumeric: ${isNumeric}`);
    
    let boletoQuery;
    
    if (isUUID) {
      console.log('   Executando query UUID...');
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE id = $1',
        [boleto_id]
      );
    } else if (isNumeric) {
      console.log('   Executando query numérica (mesma do commit 118bd1f)...');
      console.log('   Query: SELECT numero_controle, status FROM boletos WHERE numero_controle = $1 OR (id::text = $1)');
      console.log('   Param: [' + boleto_id + ']');
      
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1 OR (id::text = $1)',
        [boleto_id]
      );
    } else {
      console.log('   Executando query numero_controle...');
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1',
        [boleto_id]
      );
    }
    
    console.log(`✅ [TEST] Query executada com sucesso!`);
    console.log(`   Resultado: ${boletoQuery.rows.length} boletos encontrados`);
    
    if (boletoQuery.rows.length > 0) {
      console.log(`   Boleto encontrado: ${JSON.stringify(boletoQuery.rows[0])}`);
    } else {
      console.log('❌ [TEST] Nenhum boleto encontrado com este ID');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Erro no teste:', error.message);
    console.error('❌ [TEST] Error code:', error.code);
    console.error('❌ [TEST] Error detail:', error.detail);
    console.error('❌ [TEST] Stack trace:', error.stack);
  } finally {
    await pool.end();
    console.log('\n✅ [TEST] Teste concluído');
  }
}

testRealUpload().catch(console.error);