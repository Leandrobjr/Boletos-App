const { Pool } = require('pg');

// Configuração do banco com fallback seguro
const resolveDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
  if (envUrl && !isLocal) return envUrl;
  return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
};

const pool = new Pool({
  connectionString: resolveDatabaseUrl(),
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔧 [MIGRAÇÃO] Iniciando migração do banco de dados...');
    
    const migrations = [];
    
    // Verificar e adicionar coluna escrow_id
    const checkEscrowId = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'boletos' AND column_name = 'escrow_id'
    `);
    
    if (checkEscrowId.rowCount === 0) {
      await pool.query('ALTER TABLE boletos ADD COLUMN escrow_id VARCHAR(255)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_boletos_escrow_id ON boletos(escrow_id)');
      await pool.query("COMMENT ON COLUMN boletos.escrow_id IS 'ID do contrato escrow na blockchain'");
      migrations.push('escrow_id column added');
      console.log('✅ [MIGRAÇÃO] Coluna escrow_id adicionada');
    } else {
      migrations.push('escrow_id column already exists');
      console.log('✅ [MIGRAÇÃO] Coluna escrow_id já existe');
    }

    // Verificar e adicionar coluna tx_hash
    const checkTxHash = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'boletos' AND column_name = 'tx_hash'
    `);
    
    if (checkTxHash.rowCount === 0) {
      await pool.query('ALTER TABLE boletos ADD COLUMN tx_hash VARCHAR(255)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_boletos_tx_hash ON boletos(tx_hash)');
      await pool.query("COMMENT ON COLUMN boletos.tx_hash IS 'Hash da transação de criação do escrow'");
      migrations.push('tx_hash column added');
      console.log('✅ [MIGRAÇÃO] Coluna tx_hash adicionada');
    } else {
      migrations.push('tx_hash column already exists');
      console.log('✅ [MIGRAÇÃO] Coluna tx_hash já existe');
    }

    // Verificar e adicionar coluna data_travamento
    const checkDataTravamento = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'boletos' AND column_name = 'data_travamento'
    `);
    
    if (checkDataTravamento.rowCount === 0) {
      await pool.query('ALTER TABLE boletos ADD COLUMN data_travamento TIMESTAMP');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_boletos_data_travamento ON boletos(data_travamento)');
      await pool.query("COMMENT ON COLUMN boletos.data_travamento IS 'Data e hora do travamento do boleto'");
      migrations.push('data_travamento column added');
      console.log('✅ [MIGRAÇÃO] Coluna data_travamento adicionada');
    } else {
      migrations.push('data_travamento column already exists');
      console.log('✅ [MIGRAÇÃO] Coluna data_travamento já existe');
    }

    // Verificar estrutura final
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'boletos' 
      ORDER BY ordinal_position
    `);

    console.log('✅ [MIGRAÇÃO] Migração concluída com sucesso');

    res.status(200).json({
      success: true,
      message: 'Migração do banco de dados concluída com sucesso',
      migrations: migrations,
      table_structure: finalStructure.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [MIGRAÇÃO] Erro na migração:', error);
    res.status(500).json({
      error: 'Erro na migração do banco de dados',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};