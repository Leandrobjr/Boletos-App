const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido', allowed: ['POST','GET','OPTIONS'] });
  }

  try {
    console.log('🚀 [MIGRAÇÃO] Iniciando adição da coluna escrow_id...');

    // 1) Verificar se a coluna já existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'boletos' 
        AND column_name = 'escrow_id'
    `);

    if (checkColumn.rowCount > 0) {
      console.log('✅ [MIGRAÇÃO] Coluna escrow_id já existe');
      return res.status(200).json({ success: true, message: 'Coluna escrow_id já existe', alreadyExists: true });
    }

    // 2) Adicionar coluna escrow_id
    console.log('📝 [MIGRAÇÃO] Adicionando coluna escrow_id...');
    await pool.query(`ALTER TABLE boletos ADD COLUMN escrow_id VARCHAR(255)`);

    // 3) Criar índice para performance
    console.log('📊 [MIGRAÇÃO] Criando índice...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_boletos_escrow_id ON boletos(escrow_id)`);

    // 4) Comentário opcional
    try {
      await pool.query(`COMMENT ON COLUMN boletos.escrow_id IS 'ID do escrow do smart contract'`);
    } catch (_) {}

    // 5) Estrutura final
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'boletos' 
      ORDER BY ordinal_position
    `);

    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'boletos' 
      AND indexname LIKE '%escrow%'
    `);

    console.log('✅ [MIGRAÇÃO] escrow_id adicionada com sucesso');
    return res.status(200).json({
      success: true,
      message: 'Coluna escrow_id adicionada com sucesso',
      tableStructure: tableInfo.rows,
      indexes: indexes.rows,
      migration: {
        columnAdded: true,
        indexesCreated: indexes.rowCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [MIGRAÇÃO] Erro ao adicionar escrow_id:', error);
    return res.status(500).json({ error: 'Erro na migração', details: error.message });
  }
};