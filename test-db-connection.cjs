/**
 * 🔍 TESTE DE CONEXÃO COM BANCO NEON
 * Verifica estrutura da tabela e dados existentes
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function testDatabase() {
  try {
    console.log('🔌 Testando conexão com banco Neon...');
    
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar estrutura da tabela boletos
    console.log('\n📋 Verificando estrutura da tabela boletos...');
    const structureQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'boletos' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(structureQuery);
    console.log('📊 Estrutura da tabela:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Verificar dados existentes
    console.log('\n🔍 Verificando dados existentes...');
    const countQuery = 'SELECT COUNT(*) as total FROM boletos';
    const countResult = await client.query(countQuery);
    console.log(`📊 Total de boletos: ${countResult.rows[0].total}`);
    
    // Mostrar alguns exemplos
    if (countResult.rows[0].total > 0) {
      console.log('\n📝 Exemplos de boletos:');
      const sampleQuery = 'SELECT numero_controle, status, criado_em FROM boletos LIMIT 5';
      const sampleResult = await client.query(sampleQuery);
      sampleResult.rows.forEach(row => {
        console.log(`  - Número: ${row.numero_controle}, Status: ${row.status}, Criado: ${row.criado_em}`);
      });
    }
    
    // Testar busca específica
    console.log('\n🎯 Testando busca por número específico...');
    const testNumber = '1761517540809'; // Número que aparece na tela
    const searchQuery = 'SELECT * FROM boletos WHERE numero_controle = $1';
    const searchResult = await client.query(searchQuery, [testNumber]);
    
    console.log(`🔍 Busca por ${testNumber}:`);
    if (searchResult.rows.length > 0) {
      console.log('✅ Boleto encontrado:', searchResult.rows[0]);
    } else {
      console.log('❌ Boleto não encontrado');
      
      // Verificar se existe como string
      const stringSearchQuery = 'SELECT * FROM boletos WHERE numero_controle::text = $1';
      const stringSearchResult = await client.query(stringSearchQuery, [testNumber]);
      
      if (stringSearchResult.rows.length > 0) {
        console.log('⚠️ Encontrado como string:', stringSearchResult.rows[0]);
      }
    }
    
    client.release();
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('📍 Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testDatabase();