const { Pool } = require('pg');

// CORS util
const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
};

// Fallback seguro para conexão (evita localhost em produção)
const resolveDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
  if (envUrl && !isLocal) return envUrl;
  return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
};

const pool = new Pool({
  connectionString: resolveDatabaseUrl(),
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const parts = url.pathname.split('/').filter(Boolean);
    // Esperado: .../api/boletos/controle/{numero_controle}/reservar
    const idx = parts.indexOf('controle');
    const numero_controle = idx >= 0 ? parts[idx + 1] : undefined;
    const action = idx >= 0 ? parts[idx + 2] : undefined;

    if (!numero_controle) {
      return res.status(400).json({ error: 'numero_controle é obrigatório' });
    }

    // Implementa somente a ação reservar aqui como catch-all de segurança
    if (action === 'reservar') {
      if (req.method !== 'PATCH' && req.method !== 'POST') {
        return res.status(405).json({
          error: 'Método não permitido',
          method: req.method,
          allowed: ['PATCH', 'POST', 'OPTIONS']
        });
      }

      const { user_id, wallet_address, tx_hash } = req.body || {};

      if (!user_id || !wallet_address) {
        return res.status(400).json({
          error: 'Dados obrigatórios',
          message: 'user_id e wallet_address são obrigatórios'
        });
      }

      // Verifica se está DISPONIVEL
      const found = await pool.query(
        'SELECT * FROM boletos WHERE numero_controle = $1 AND status = $2',
        [String(numero_controle), 'DISPONIVEL']
      );

      if (found.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado ou não disponível',
          numero_controle
        });
      }

      // Atualiza para AGUARDANDO_PAGAMENTO e registra campos quando existirem
      const updateFull = `
        UPDATE boletos 
        SET status = 'AGUARDANDO_PAGAMENTO',
            data_travamento = NOW(),
            wallet_address = COALESCE($1, wallet_address),
            comprador_id = COALESCE($2, comprador_id),
            tx_hash = COALESCE($3, tx_hash)
        WHERE numero_controle = $4 AND status = 'DISPONIVEL'
        RETURNING *
      `;

      try {
        const result = await pool.query(updateFull, [wallet_address, user_id, tx_hash || null, String(numero_controle)]);
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Boleto não encontrado ou já reservado', numero_controle });
        }
        return res.status(200).json({ success: true, data: result.rows[0], message: 'Boleto reservado com sucesso' });
      } catch (e) {
        // Fallback caso colunas não existam
        try {
          const minimal = await pool.query(
            `UPDATE boletos 
             SET status = 'AGUARDANDO_PAGAMENTO'
             WHERE numero_controle = $1 AND status = 'DISPONIVEL'
             RETURNING *`,
            [String(numero_controle)]
          );
          if (minimal.rowCount === 0) {
            return res.status(404).json({ error: 'Boleto não encontrado ou já reservado', numero_controle });
          }
          return res.status(200).json({ success: true, data: minimal.rows[0], message: 'Boleto reservado (parcial) com sucesso' });
        } catch (inner) {
          console.error('❌ Erro ao reservar boleto (catch-all):', inner);
          return res.status(500).json({ error: 'Erro interno do servidor', details: inner.message });
        }
      }
    }

    // Se não for a ação esperada, retornar 404 para evitar conflito com outras rotas
    return res.status(404).json({ error: 'Rota não encontrada' });
  } catch (error) {
    console.error('❌ Erro na rota catch-all de controle:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};