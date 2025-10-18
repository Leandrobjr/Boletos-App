const { Pool } = require('pg');
const { requireAdmin } = require('./_utils/adminAuth');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Requer autorização administrativa
  if (!(await requireAdmin(req, res))) return;

  try {
    console.log('🚀 [MIGRAÇÃO] Executando migrações necessárias...');

    if (req.method === 'GET' || req.method === 'POST') {
      // MIGRAÇÃO 1: comprador_id
      const checkComprador = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'boletos' 
          AND column_name = 'comprador_id'
      `);

      if (checkComprador.rowCount === 0) {
        console.log('📝 [MIGRAÇÃO] Adicionando coluna comprador_id...');
        await pool.query(`ALTER TABLE boletos ADD COLUMN comprador_id VARCHAR(255)`);
        console.log('📊 [MIGRAÇÃO] Criando índices comprador_id...');
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_boletos_comprador_id ON boletos(comprador_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_boletos_comprador_status ON boletos(comprador_id, status)`);
        console.log('💬 [MIGRAÇÃO] Comentário comprador_id...');
        await pool.query(`COMMENT ON COLUMN boletos.comprador_id IS 'ID do usuário comprador (Firebase UID)'`);
      } else {
        console.log('✅ [MIGRAÇÃO] Coluna comprador_id já existe');
      }

      // MIGRAÇÃO 2: escrow_id
      const checkEscrow = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'boletos' 
          AND column_name = 'escrow_id'
      `);

      if (checkEscrow.rowCount === 0) {
        console.log('📝 [MIGRAÇÃO] Adicionando coluna escrow_id...');
        await pool.query(`ALTER TABLE boletos ADD COLUMN escrow_id VARCHAR(255)`);
        console.log('📊 [MIGRAÇÃO] Criando índices escrow_id...');
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_boletos_escrow_id ON boletos(escrow_id)`);
        console.log('💬 [MIGRAÇÃO] Comentário escrow_id...');
        try { await pool.query(`COMMENT ON COLUMN boletos.escrow_id IS 'ID do escrow do smart contract'`); } catch (_) {}
      } else {
        console.log('✅ [MIGRAÇÃO] Coluna escrow_id já existe');
      }

      // Resumo
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
      `);

      console.log('✅ [MIGRAÇÃO] Migrações concluídas');

      res.status(200).json({
        success: true,
        message: 'Migrações executadas com sucesso',
        tableStructure: tableInfo.rows,
        indexes: indexes.rows,
        migration: {
          timestamp: new Date().toISOString()
        }
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'POST', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ [MIGRAÇÃO] Erro:', error);
    res.status(500).json({
      error: 'Erro na migração',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
