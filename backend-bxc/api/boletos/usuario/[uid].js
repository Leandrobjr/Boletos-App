const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // 1. CORS Headers (OBRIGATÓRIO)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 2. Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extrair UID da query string ou URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const uid = url.searchParams.get('uid') || url.pathname.split('/').pop();

    console.log(`🚀 API Boletos Usuario [UID] Request: ${req.method} ${req.url}, UID: ${uid}`);

    if (!uid || uid === 'usuario') {
      res.status(400).json({
        error: 'UID é obrigatório',
        message: 'Parâmetro uid não fornecido na URL'
      });
      return;
    }

    if (req.method === 'GET') {
      // Buscar boletos do usuário
      const result = await pool.query(
        'SELECT * FROM boletos WHERE user_id = $1 ORDER BY criado_em DESC',
        [uid]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount,
        usuario_id: uid
      });

    } else if (req.method === 'POST') {
      // Criar boleto para o usuário
      const { numero_controle, valor, vencimento, descricao } = req.body;

      if (!numero_controle || !valor) {
        return res.status(400).json({
          error: 'Dados obrigatórios faltando',
          required: ['numero_controle', 'valor']
        });
      }

      const result = await pool.query(
        'INSERT INTO boletos (numero_controle, valor, vencimento, user_id, descricao, status, criado_em) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
        [numero_controle, valor, vencimento, uid, descricao, 'DISPONIVEL']
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto criado com sucesso'
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'POST', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos Usuario [UID]:', error);
    // Garantir headers CORS mesmo em erro
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}; 