const { Pool } = require('pg');

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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🚀 [MIGRAÇÃO DE DADOS] Iniciando migração de wallet_address para comprador_id...');

    if (req.method === 'GET' || req.method === 'POST') {
      
      // 1. Verificar se há boletos com wallet_address mas sem comprador_id
      const boletosParaMigrar = await pool.query(`
        SELECT id, wallet_address, status, user_id
        FROM boletos 
        WHERE wallet_address IS NOT NULL 
        AND wallet_address != ''
        AND comprador_id IS NULL
        AND status IN ('PENDENTE_PAGAMENTO', 'AGUARDANDO_BAIXA', 'BAIXADO')
      `);

      console.log(`📊 [MIGRAÇÃO] Encontrados ${boletosParaMigrar.rowCount} boletos para migrar`);

      if (boletosParaMigrar.rowCount === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nenhum boleto precisa ser migrado',
          migrated: 0,
          alreadyMigrated: true
        });
      }

      // 2. Para cada boleto, vamos usar o user_id como comprador_id temporariamente
      // (assumindo que quem tem wallet_address é o comprador)
      let migratedCount = 0;
      const errors = [];

      for (const boleto of boletosParaMigrar.rows) {
        try {
          // Usar o user_id como comprador_id (assumindo que é o comprador)
          await pool.query(`
            UPDATE boletos 
            SET comprador_id = $1 
            WHERE id = $2
          `, [boleto.user_id, boleto.id]);
          
          migratedCount++;
          console.log(`✅ [MIGRAÇÃO] Boleto ${boleto.id} migrado`);
        } catch (error) {
          console.error(`❌ [MIGRAÇÃO] Erro ao migrar boleto ${boleto.id}:`, error.message);
          errors.push({ boletoId: boleto.id, error: error.message });
        }
      }

      // 3. Verificar resultado
      const boletosMigrados = await pool.query(`
        SELECT COUNT(*) as total
        FROM boletos 
        WHERE comprador_id IS NOT NULL
      `);

      console.log('✅ [MIGRAÇÃO] Migração de dados concluída');

      res.status(200).json({
        success: true,
        message: 'Migração de dados executada com sucesso',
        migration: {
          totalFound: boletosParaMigrar.rowCount,
          migrated: migratedCount,
          errors: errors.length,
          errorsDetails: errors,
          totalWithCompradorId: parseInt(boletosMigrados.rows[0].total),
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
      error: 'Erro na migração de dados',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
