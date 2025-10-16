const { Pool } = require('pg');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
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

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  // Capturar o ID de forma robusta: req.query.id (dinâmico do Vercel) ou parse manual da URL
  let { id } = req.query || {};
  if (!id) {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const parts = url.pathname.split('/').filter(Boolean); // ['api','boletos',':id','comprovante']
      const idx = parts.indexOf('boletos');
      if (idx !== -1 && parts[idx + 1]) {
        id = parts[idx + 1];
      }
    } catch (e) {
      // Ignorar erro de parse; trataremos como ausência de id abaixo
    }
  }

  console.log(`🚀 API Request: ${method} /api/boletos/${id}/comprovante`);
  console.log('📍 Body:', req.body);

  try {
    if (method !== 'PATCH' && method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido', allowed: ['PATCH','POST','OPTIONS'] });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID do boleto é obrigatório na URL' });
    }

    const { comprovante_url, comprovante, filename, filesize, filetype } = req.body || {};
    const payload = comprovante_url || comprovante;
    if (!payload) {
      return res.status(400).json({ error: 'comprovante_url ou comprovante é obrigatório' });
    }

    // Verificar existência do boleto
    const select = await pool.query('SELECT * FROM boletos WHERE numero_controle = $1', [id]);
    if (select.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado', numero_controle: id });
    }

    const boleto = select.rows[0];
    const statusAtual = boleto.status;
    // Aceitar variações de status esperadas no fluxo
    const statusOk = ['PENDENTE_PAGAMENTO', 'AGUARDANDO_PAGAMENTO'].includes(statusAtual);
    if (!statusOk) {
      return res.status(400).json({ error: 'Boleto não está pendente de pagamento', status_atual: statusAtual, numero_controle: id });
    }

    // Atualizar para AGUARDANDO_BAIXA e salvar comprovante
    const update = await pool.query(
      `UPDATE boletos
         SET status = 'AGUARDANDO_BAIXA',
             comprovante_url = $1,
             comprovante_filename = $2,
             comprovante_filetype = $3,
             upload_em = NOW(),
             tempo_limite_baixa = NOW() + INTERVAL '72 hours'
       WHERE numero_controle = $4
       RETURNING *`,
      [payload, filename || null, filetype || null, id]
    );

    const atualizado = update.rows[0];
    console.log('✅ Comprovante salvo em produção:', atualizado.id || atualizado.numero_controle);
    return res.status(200).json(atualizado);

  } catch (error) {
    console.error('❌ Erro ao salvar comprovante (produção):', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};