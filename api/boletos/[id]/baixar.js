const { Pool } = require('pg');

// CORS
function applyCors(req, res) {
  const origin = req.headers.origin || '*';
  const acrh = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', acrh || 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// DB via variáveis separadas
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

const pool = new Pool({
  connectionString: `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`,
  ssl: { rejectUnauthorized: false },
});

async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise(resolve => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Método não permitido', allowed: ['PATCH'] });

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const parts = url.pathname.split('/'); // ['', 'api', 'boletos', ':id', 'baixar']
    const id = parts[3];
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

    const { tx_hash } = await getJsonBody(req);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Atualiza status para BAIXADO. Se tx_hash enviado, salva no mesmo campo existente
    const result = await pool.query(
      isUUID
        ? 'UPDATE boletos SET status = $1, tx_hash = COALESCE($2, tx_hash) WHERE id = $3 RETURNING *'
        : 'UPDATE boletos SET status = $1, tx_hash = COALESCE($2, tx_hash) WHERE numero_controle = $3 RETURNING *',
      ['BAIXADO', tx_hash || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado', id });
    }

    return res.status(200).json({ success: true, data: result.rows[0], message: 'Boleto baixado com sucesso' });
  } catch (error) {
    console.error('❌ Erro em /boletos/:id/baixar:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};


