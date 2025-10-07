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
    console.log(`🚀 API Boletos Comprados Request: ${req.method} ${req.url}`);
    
    if (req.method === 'GET') {
      // Extrair UID da URL (como faz a API do vendedor)
      const url = new URL(req.url, `http://${req.headers.host}`);
      const uid = url.searchParams.get('uid') || url.pathname.split('/').pop();
      
      // Debug: Log da URL completa para verificar parâmetros
      console.log('🔍 URL completa:', req.url);
      console.log('🔍 Parâmetros da URL:', url.searchParams.toString());
      
      console.log('🔍 Buscando boletos comprados pelo usuário:', uid);
      
      if (!uid || uid === 'comprados') {
        return res.status(400).json({
          error: 'UID do usuário é obrigatório',
          message: 'Forneça o UID do usuário para buscar seus boletos comprados'
        });
      }
      
      // Buscar boletos comprados pelo usuário (lógica original do server.js)
      // Um user_id pode ser comprador em algumas transações e vendedor em outras
      const result = await pool.query(
        `SELECT * FROM boletos 
         WHERE comprador_id = $1 
         AND status IN ('PENDENTE_PAGAMENTO', 'AGUARDANDO_BAIXA', 'BAIXADO')
         ORDER BY criado_em DESC`,
        [uid]
      );
      
      console.log('✅ Boletos encontrados:', result.rowCount);
      
      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos Comprados:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
  }
}; 