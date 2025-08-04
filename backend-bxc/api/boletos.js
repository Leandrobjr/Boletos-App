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
    console.log(`🚀 API Boletos Request: ${req.method} ${req.url}`);

    if (req.method === 'GET') {
      // Buscar todos os boletos
      const result = await pool.query('SELECT * FROM boletos ORDER BY criado_em DESC');
      
      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });

    } else if (req.method === 'POST') {
      // Criar novo boleto
      const { 
        numero_controle, 
        valor, 
        vencimento, 
        usuario_id, 
        descricao,
        codigo_barras,
        cpf_cnpj,
        instituicao
      } = req.body;

      if (!numero_controle || !valor || !usuario_id) {
        return res.status(400).json({
          error: 'Dados obrigatórios faltando',
          required: ['numero_controle', 'valor', 'usuario_id']
        });
      }

      // Formatar data de vencimento se fornecida
      let dataVencimento = null;
      if (vencimento) {
        try {
          // Converter de DD/MM/YYYY para YYYY-MM-DD
          const [dia, mes, ano] = vencimento.split('/');
          dataVencimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        } catch (error) {
          console.warn('Erro ao formatar data de vencimento:', error);
        }
      }

      const result = await pool.query(
        `INSERT INTO boletos (
          numero_controle, valor, vencimento, user_id, descricao, 
          status, codigo_barras, cpf_cnpj, instituicao, criado_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
        [
          numero_controle, 
          valor, 
          dataVencimento, 
          usuario_id, 
          descricao, 
          'DISPONIVEL',
          codigo_barras || null,
          cpf_cnpj || null,
          instituicao || null
        ]
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
    console.error('❌ Erro na API Boletos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}; 