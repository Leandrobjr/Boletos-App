const { Pool } = require('pg');

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// DB (variáveis separadas)
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
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Método não permitido', allowed: ['PATCH'] });

  try {
    // Extrair id (uuid ou numero_controle)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const parts = url.pathname.split('/'); // ['', 'api', 'boletos', '{id}', 'reservar']
    const id = req.query?.id || parts[3];

    const { user_id, wallet_address, tx_hash } = await getJsonBody(req);
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
    if (!user_id || !wallet_address) return res.status(400).json({ error: 'Dados obrigatórios', required: ['user_id', 'wallet_address'] });

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Buscar boleto
    const check = await pool.query(
      isUUID ? 'SELECT * FROM boletos WHERE id = $1' : 'SELECT * FROM boletos WHERE numero_controle = $1',
      [id]
    );
    if (check.rowCount === 0) return res.status(404).json({ error: 'Boleto não encontrado', id });

    const boleto = check.rows[0];
    if (boleto.status !== 'DISPONIVEL') {
      return res.status(400).json({ error: 'Boleto não disponível', status: boleto.status });
    }

    // Atualizar status e dados de reserva
    const update = await pool.query(
      isUUID
        ? 'UPDATE boletos SET status = $1, wallet_address = $2, tx_hash = $3 WHERE id = $4 AND status = $5 RETURNING *'
        : 'UPDATE boletos SET status = $1, wallet_address = $2, tx_hash = $3 WHERE numero_controle = $4 AND status = $5 RETURNING *',
      ['AGUARDANDO PAGAMENTO', wallet_address, tx_hash || null, id, 'DISPONIVEL']
    );

    if (update.rowCount === 0) return res.status(409).json({ error: 'Conflito', message: 'Boleto não está mais disponível' });

    return res.status(200).json({ success: true, data: update.rows[0], message: 'Boleto reservado com sucesso' });
  } catch (error) {
    console.error('❌ Erro em reservar boleto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};


