const { Pool } = require('pg');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const uid = req.query?.uid || url.searchParams.get('uid') || url.pathname.split('/').pop();
    if (!uid || uid === 'comprados') {
      return res.status(400).json({ error: 'UID é obrigatório' });
    }

    if (req.method === 'GET') {
      // Seleciona boletos comprados pelo uid (status diferente de DISPONIVEL)
      const result = await pool.query(
        `SELECT * FROM boletos 
         WHERE comprador_id = $1 OR (user_id = $1 AND status <> 'DISPONIVEL')
         ORDER BY criado_em DESC`,
        [uid]
      );
      return res.status(200).json({ success: true, data: result.rows, count: result.rowCount });
    }

    return res.status(405).json({ error: 'Método não permitido', allowed: ['GET'] });
  } catch (error) {
    console.error('❌ Erro em /boletos/comprados/[uid]:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};


