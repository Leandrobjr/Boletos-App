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

  // Capturar o ID/identificador de forma robusta: via req.query.id (fornecido pelo Vercel) ou parse manual da URL
  let { id } = req.query || {};
  if (!id) {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const parts = url.pathname.split('/').filter(Boolean); // ['api','boletos',':id','baixar']
      const idx = parts.indexOf('boletos');
      if (idx !== -1 && parts[idx + 1]) {
        id = parts[idx + 1];
      }
    } catch (e) {
      // Ignorar erro de parse
    }
  }

  console.log(`🚀 API Request: ${method} /api/boletos/${id}/baixar`);
  console.log('📍 Body:', req.body);

  try {
    if (method !== 'PATCH' && method !== 'PUT') {
      return res.status(405).json({ error: 'Método não permitido', allowed: ['PATCH', 'PUT', 'OPTIONS'] });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID do boleto é obrigatório na URL' });
    }

    const { tx_hash, wallet_address_vendedor, wallet_address_comprador, user_id } = req.body || {};

    // Buscar boleto por numero_controle OU id
    const select = await pool.query(
      `SELECT * FROM boletos WHERE numero_controle = $1 OR id::text = $1 LIMIT 1`,
      [String(id)]
    );

    if (select.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado', ident: id });
    }

    const boleto = select.rows[0];

    // Normalizar status (aceitar variantes com espaço)
    const normalized = String(boleto.status || '').replace(/\s+/g, '_').toUpperCase();
    if (normalized !== 'AGUARDANDO_BAIXA') {
      return res.status(400).json({ error: 'Boleto não está aguardando baixa', status_atual: boleto.status });
    }

    // Atualizar para BAIXADO e registrar tx_hash (se fornecido)
    const update = await pool.query(
      `UPDATE boletos
         SET status = 'BAIXADO',
             tx_hash = COALESCE($1, tx_hash)
       WHERE id = $2
       RETURNING *`,
      [tx_hash || null, boleto.id]
    );

    const atualizado = update.rows[0];

    console.log('✅ Boleto baixado em produção:', atualizado.id || atualizado.numero_controle);
    return res.status(200).json({ success: true, data: atualizado });

  } catch (error) {
    console.error('❌ Erro ao baixar boleto (produção):', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};