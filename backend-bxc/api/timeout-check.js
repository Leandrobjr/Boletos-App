/**
 * 🔍 VERCEL FUNCTION - Verificação de Timeout de Boletos (SIMPLIFICADA)
 * 
 * Endpoint para verificação manual e estatísticas de timeout
 * Rota: GET/POST /api/timeout-check
 * 
 * @author Engenheiro Sênior
 * @version 1.0.2 - Produção (Sem dependências externas)
 */

const { Pool } = require('pg');

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
    console.log(`🚀 API Timeout Check Request: ${req.method} ${req.url}`);
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request Headers:', req.headers);

    // Configurar conexão com banco
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    if (req.method === 'GET') {
      // 📊 Obter estatísticas básicas
      const statsQuery = `
        SELECT 
          COUNT(*) as total_boletos,
          COUNT(CASE WHEN status = 'AGUARDANDO PAGAMENTO' THEN 1 END) as aguardando_pagamento,
          COUNT(CASE WHEN status = 'DISPONIVEL' THEN 1 END) as disponivel,
          COUNT(CASE WHEN status = 'VENCIDO' THEN 1 END) as vencido
        FROM boletos
      `;
      
      const statsResult = await pool.query(statsQuery);
      const stats = statsResult.rows[0];

      // Verificar boletos que podem estar expirados
      const expiredQuery = `
        SELECT id, numero_controle, data_travamento, status
        FROM boletos 
        WHERE status = 'AGUARDANDO PAGAMENTO' 
        AND data_travamento IS NOT NULL
        AND data_travamento < NOW() - INTERVAL '60 minutes'
        LIMIT 10
      `;
      
      const expiredResult = await pool.query(expiredQuery);

      res.status(200).json({
        success: true,
        data: {
          stats: stats,
          expired_boletos: expiredResult.rows,
          total_expired: expiredResult.rowCount
        },
        message: 'Estatísticas de timeout obtidas com sucesso',
        endpoint: '/api/timeout-check',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'POST') {
      // 🔍 Executar verificação e correção manual
      console.log('🔍 Executando verificação manual de timeout...');
      
      // Buscar boletos expirados
      const expiredQuery = `
        SELECT id, numero_controle, data_travamento, escrow_id
        FROM boletos 
        WHERE status = 'AGUARDANDO PAGAMENTO' 
        AND data_travamento IS NOT NULL
        AND data_travamento < NOW() - INTERVAL '60 minutes'
      `;
      
      const expiredResult = await pool.query(expiredQuery);
      const expiredBoletos = expiredResult.rows;

      let processedCount = 0;
      let errors = [];

      for (const boleto of expiredBoletos) {
        try {
          // Atualizar status para DISPONIVEL
          const updateQuery = `
            UPDATE boletos 
            SET 
              status = 'DISPONIVEL',
              data_destravamento = NOW(),
              comprador_id = NULL,
              wallet_address = NULL,
              data_compra = NULL,
              tempo_limite = NULL
            WHERE id = $1
          `;
          
          await pool.query(updateQuery, [boleto.id]);
          processedCount++;
          
          console.log(`✅ Boleto ${boleto.numero_controle} destravado com sucesso`);
          
        } catch (error) {
          console.error(`❌ Erro ao processar boleto ${boleto.numero_controle}:`, error);
          errors.push({
            boleto_id: boleto.id,
            numero_controle: boleto.numero_controle,
            error: error.message
          });
        }
      }

      // Obter estatísticas finais
      const statsQuery = `
        SELECT 
          COUNT(*) as total_boletos,
          COUNT(CASE WHEN status = 'AGUARDANDO PAGAMENTO' THEN 1 END) as aguardando_pagamento,
          COUNT(CASE WHEN status = 'DISPONIVEL' THEN 1 END) as disponivel
        FROM boletos
      `;
      
      const statsResult = await pool.query(statsQuery);

      res.status(200).json({
        success: true,
        data: {
          message: 'Verificação de timeout executada com sucesso',
          processed_count: processedCount,
          total_expired_found: expiredBoletos.length,
          errors: errors,
          final_stats: statsResult.rows[0]
        },
        endpoint: '/api/timeout-check',
        timestamp: new Date().toISOString()
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'POST', 'OPTIONS']
      });
    }

    await pool.end();

  } catch (error) {
    console.error('❌ Erro na API Timeout Check:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      endpoint: '/api/timeout-check',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};