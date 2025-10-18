const { Pool } = require('pg');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json; charset=utf-8'
};

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // Adicionar headers CORS
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  // Capturar o ID dinamicamente
  let { id } = req.query || {};
  if (!id) {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('boletos');
      if (idx !== -1 && parts[idx + 1]) {
        id = parts[idx + 1];
      }
    } catch (e) {}
  }

  console.log(`🚀 API Request: ${method} /api/boletos/${id}/escrow`);
  console.log('📍 Body:', req.body);

  try {
    if (method !== 'PATCH' && method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido', allowed: ['PATCH','POST','OPTIONS'] });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID do boleto é obrigatório na URL' });
    }

    const { escrow_id, tx_hash } = req.body || {};
    if (!escrow_id || String(escrow_id).trim() === '') {
      return res.status(400).json({ error: 'escrow_id é obrigatório no corpo da requisição' });
    }

    // Buscar boleto por numero_controle OU id
    const select = await pool.query(
      `SELECT * FROM boletos WHERE numero_controle = $1 OR id::text = $1 LIMIT 1`,
      [String(id)]
    );

    if (select.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado', ident: id });
    }

    const boleto = select.rows[0];

    // Atualizar escrow_id e tx_hash
    const update = await pool.query(
      `UPDATE boletos
         SET escrow_id = $1,
             tx_hash = COALESCE($2, tx_hash)
       WHERE id = $3
       RETURNING *`,
      [String(escrow_id), tx_hash || null, boleto.id]
    );

    const atualizado = update.rows[0];
    console.log('✅ Escrow atualizado para boleto:', atualizado.id || atualizado.numero_controle, '→', atualizado.escrow_id);

    return res.status(200).json({ success: true, data: atualizado });

  } catch (error) {
    console.error('❌ Erro ao atualizar escrow_id do boleto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};