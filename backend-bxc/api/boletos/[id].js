const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.pathname.split('/').pop();
    const action = url.pathname.split('/')[3]; // cancelar, excluir, etc.

    console.log(`🚀 API Boletos [ID] Request: ${req.method} ${req.url}, ID: ${id}, Action: ${action}`);

    if (!id || id === 'boletos') {
      return res.status(400).json({
        error: 'ID é obrigatório',
        message: 'Parâmetro id não fornecido na URL'
      });
    }

    if (req.method === 'PATCH' && action === 'cancelar') {
      // Cancelar boleto
      const result = await pool.query(
        'UPDATE boletos SET status = $1 WHERE id = $2 RETURNING *',
        ['EXCLUIDO', id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto cancelado com sucesso'
      });

    } else if (req.method === 'DELETE') {
      // Excluir boleto
      const result = await pool.query(
        'DELETE FROM boletos WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto excluído com sucesso'
      });

    } else if (req.method === 'GET') {
      // Buscar boleto específico
      const result = await pool.query(
        'SELECT * FROM boletos WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'PATCH', 'DELETE', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos [ID]:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}; 