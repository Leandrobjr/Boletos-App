const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const numero_controle = pathParts[pathParts.length - 1];

    console.log(`🚀 API Boletos Controle Request: ${req.method} ${req.url}, Número Controle: ${numero_controle}`);

    if (!numero_controle || numero_controle === 'controle') {
      return res.status(400).json({
        error: 'Número de controle é obrigatório',
        message: 'Parâmetro numero_controle não fornecido na URL'
      });
    }

    if (req.method === 'GET') {
      // Buscar boleto por número de controle
      console.log(`🔍 Buscando boleto com numero_controle: ${numero_controle}`);
      
      const result = await pool.query(
        'SELECT * FROM boletos WHERE numero_controle = $1',
        [String(numero_controle)]
      );

      console.log(`📊 Resultado da busca: ${result.rowCount} boleto(s) encontrado(s)`);

      if (result.rowCount === 0) {
        console.log(`❌ Boleto não encontrado para numero_controle: ${numero_controle}`);
        return res.status(404).json({
          error: 'Boleto não encontrado',
          message: `Nenhum boleto encontrado com número de controle: ${numero_controle}`,
          numero_controle: numero_controle
        });
      }

      const boleto = result.rows[0];
      console.log(`✅ Boleto encontrado: ID ${boleto.id}, Status: ${boleto.status}`);

      res.status(200).json({
        success: true,
        data: boleto
      });

    } else if (req.method === 'PATCH') {
      // Atualizar boleto por número de controle
      console.log(`🔄 Atualizando boleto com numero_controle: ${numero_controle}`);
      console.log('📦 Body recebido:', req.body);

      const updates = req.body;
      
      // Construir query dinâmica baseada nos campos enviados
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(field => {
        if (['status', 'comprovante_url', 'tx_hash', 'wallet_address', 'comprador_id'].includes(field)) {
          updateFields.push(`${field} = $${paramIndex}`);
          updateValues.push(updates[field]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Nenhum campo válido para atualizar',
          validFields: ['status', 'comprovante_url', 'tx_hash', 'wallet_address', 'comprador_id']
        });
      }

      updateValues.push(String(numero_controle));
      const query = `UPDATE boletos SET ${updateFields.join(', ')} WHERE numero_controle = $${paramIndex} RETURNING *`;

      console.log(`🗄️ Executando query: ${query}`);
      console.log(`📝 Valores: ${JSON.stringify(updateValues)}`);

      const result = await pool.query(query, updateValues);

      if (result.rowCount === 0) {
        console.log(`❌ Boleto não encontrado para atualização: ${numero_controle}`);
        return res.status(404).json({
          error: 'Boleto não encontrado',
          numero_controle: numero_controle
        });
      }

      console.log(`✅ Boleto atualizado com sucesso: ${numero_controle}`);
      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto atualizado com sucesso'
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'PATCH', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos Controle:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
  }
};
