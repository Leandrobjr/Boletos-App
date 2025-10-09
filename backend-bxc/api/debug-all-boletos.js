const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    console.log('🔍 [DEBUG] Buscando TODOS os boletos na tabela...');
    
    // Buscar TODOS os boletos
    const result = await pool.query(`
      SELECT id, numero_controle, status, data_travamento, user_id, comprador_id, criado_em
      FROM boletos 
      ORDER BY criado_em DESC
    `);
    
    console.log(`📊 [DEBUG] Encontrados ${result.rowCount} boletos na tabela`);
    
    // Verificar estrutura da tabela
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'boletos' 
      ORDER BY ordinal_position
    `);
    
    res.status(200).json({
      success: true,
      total_boletos: result.rowCount,
      estrutura_tabela: tableInfo.rows,
      boletos: result.rows,
      debug_info: {
        timestamp: new Date().toISOString(),
        aguardando_pagamento: result.rows.filter(b => b.status === 'AGUARDANDO_PAGAMENTO').length,
        com_data_travamento: result.rows.filter(b => b.data_travamento).length
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erro:', error);
    res.status(500).json({
      error: 'Erro interno',
      details: error.message
    });
  }
};
