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
    // Buscar boletos com vencimento null
    const nullDatesResult = await pool.query(
      'SELECT id, numero_controle, criado_em FROM boletos WHERE vencimento IS NULL'
    );

    let updatedCount = 0;
    for (const boleto of nullDatesResult.rows) {
      const criadoEm = new Date(boleto.criado_em);
      const vencimento = new Date(criadoEm);
      vencimento.setDate(vencimento.getDate() + 30);
      const y = vencimento.getFullYear();
      const m = String(vencimento.getMonth() + 1).padStart(2, '0');
      const d = String(vencimento.getDate()).padStart(2, '0');
      const ymd = `${y}-${m}-${d}`;
      const updateResult = await pool.query(
        'UPDATE boletos SET vencimento = $1 WHERE id = $2',
        [ymd, boleto.id]
      );
      if (updateResult.rowCount > 0) updatedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `${updatedCount} boletos atualizados com vencimento padrão (30 dias)`,
      updated: updatedCount,
      total: nullDatesResult.rowCount,
    });
  } catch (error) {
    console.error('❌ Erro em fix-null-dates:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};


