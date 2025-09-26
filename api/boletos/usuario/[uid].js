const { Pool } = require('pg');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// DB via variáveis separadas
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

const pool = new Pool({
  connectionString: `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`,
  ssl: { rejectUnauthorized: false },
});

module.exports = async (req, res) => {
  // Apply CORS
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Extrai UID do path ou query
    const url = new URL(req.url, `http://${req.headers.host}`);
    const uid = req.query?.uid || url.searchParams.get('uid') || url.pathname.split('/').pop();

    if (!uid || uid === 'usuario') {
      return res.status(400).json({ error: 'UID é obrigatório' });
    }

    if (req.method === 'GET') {
      console.log(`🔍 [DEBUG] Buscando boletos para usuário: ${uid}`);
      
      const result = await pool.query(
        'SELECT *, comprador_id FROM boletos WHERE user_id = $1 ORDER BY criado_em DESC',
        [uid]
      );
      
      console.log(`📊 [DEBUG] Encontrados ${result.rowCount} boletos para usuário ${uid}`);
      console.log(`📋 [DEBUG] Primeiros 3 boletos:`, result.rows.slice(0, 3).map(b => ({
        id: b.id,
        numero_controle: b.numero_controle,
        valor_brl: b.valor_brl,
        status: b.status,
        criado_em: b.criado_em
      })));
      
      return res.status(200).json({ success: true, data: result.rows, count: result.rowCount });
    }

    return res.status(405).json({ error: 'Método não permitido', allowed: ['GET'] });
  } catch (error) {
    console.error('❌ Erro em /boletos/usuario/[uid]:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};


