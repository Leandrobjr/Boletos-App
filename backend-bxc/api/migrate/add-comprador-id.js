const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 2. Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🚀 [MIGRAÇÃO] Iniciando adição da coluna comprador_id...');

    if (req.method === 'POST') {
      // Verificar se a coluna já existe
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'boletos' 
        AND column_name = 'comprador_id'
      `);

      if (checkColumn.rowCount > 0) {
        console.log('✅ [MIGRAÇÃO] Coluna comprador_id já existe');
        return res.status(200).json({
          success: true,
          message: 'Coluna comprador_id já existe',
          alreadyExists: true
        });
      }

      // 1. Adicionar coluna comprador_id
      console.log('📝 [MIGRAÇÃO] Adicionando coluna comprador_id...');
      await pool.query(`
        ALTER TABLE boletos 
        ADD COLUMN comprador_id VARCHAR(255)
      `);

      // 2. Criar índice para performance
      console.log('📊 [MIGRAÇÃO] Criando índices...');
      await pool.query(`
        CREATE INDEX idx_boletos_comprador_id ON boletos(comprador_id)
      `);

      await pool.query(`
        CREATE INDEX idx_boletos_comprador_status ON boletos(comprador_id, status)
      `);

      // 3. Adicionar comentário
      await pool.query(`
        COMMENT ON COLUMN boletos.comprador_id IS 'ID do usuário comprador (Firebase UID)'
      `);

      // 4. Verificar estrutura final
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
        AND indexname LIKE '%comprador%'
      `);

      console.log('✅ [MIGRAÇÃO] Migração concluída com sucesso');

      res.status(200).json({
        success: true,
        message: 'Coluna comprador_id adicionada com sucesso',
        tableStructure: tableInfo.rows,
        indexes: indexes.rows,
        migration: {
          columnAdded: true,
          indexesCreated: indexes.rowCount,
          timestamp: new Date().toISOString()
        }
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['POST', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ [MIGRAÇÃO] Erro na migração:', error);
    res.status(500).json({
      error: 'Erro na migração',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
