const { Pool } = require('pg');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { numeroControle } = req.query;
  console.log(`🚀 API Request: ${method} /api/proxy/comprovante/${numeroControle}`);

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const found = await pool.query('SELECT comprovante_url, comprovante_filename, comprovante_filetype FROM boletos WHERE numero_controle = $1', [numeroControle]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado', numero_controle: numeroControle });
    }
    const { comprovante_url, comprovante_filename, comprovante_filetype } = found.rows[0];
    if (!comprovante_url) {
      return res.status(404).json({ error: 'Comprovante não encontrado para este boleto' });
    }

    return res.status(200).json({
      numero_controle: numeroControle,
      comprovante_url,
      filename: comprovante_filename || null,
      filetype: comprovante_filetype || null
    });
  } catch (error) {
    console.error('❌ Erro ao obter comprovante (produção):', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};