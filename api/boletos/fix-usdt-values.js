const { Pool } = require('pg');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

const pool = new Pool({
  connectionString: `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`,
  ssl: { rejectUnauthorized: false },
});

module.exports = async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido', allowed: ['PATCH'] });
  }

  try {
    // Buscar boletos onde valor_usdt = valor_brl (não convertidos)
    const uncorrectedResult = await pool.query(
      'SELECT id, numero_controle, valor_brl, valor_usdt FROM boletos WHERE valor_usdt = valor_brl'
    );

    let updatedCount = 0;
    for (const boleto of uncorrectedResult.rows) {
      const valorBRL = parseFloat(boleto.valor_brl);
      const valorUSDT = valorBRL * 0.18; // conversão aproximada
      const updateResult = await pool.query(
        'UPDATE boletos SET valor_usdt = $1 WHERE id = $2',
        [valorUSDT.toFixed(2), boleto.id]
      );
      if (updateResult.rowCount > 0) updatedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `${updatedCount} boletos atualizados com valores USDT convertidos`,
      updated: updatedCount,
      total: uncorrectedResult.rowCount,
    });
  } catch (error) {
    console.error('❌ Erro em fix-usdt-values:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};


