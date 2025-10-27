// Versão de debug do upload-comprovante para identificar erro exato
const { Pool } = require('pg');

// Configuração do banco - só usar PostgreSQL em produção
let pool = null;
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

if (isProduction) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: {
      rejectUnauthorized: false
    }
  });
}

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 [DEBUG] Iniciando debug do upload-comprovante');
    console.log('🔍 [DEBUG] Environment:', { NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL });
    console.log('🔍 [DEBUG] Pool configurado:', !!pool);

    // Verificar se estamos em produção para usar PostgreSQL
    if (!isProduction || !pool) {
      return res.status(503).json({ 
        error: 'Serviço disponível apenas em produção',
        message: 'Upload de comprovante funciona apenas no ambiente de produção com banco PostgreSQL',
        debug: { isProduction, hasPool: !!pool }
      });
    }

    const { boleto_id, file_data, filename, filetype } = req.body;
    
    console.log('🔍 [DEBUG] Dados recebidos:', { 
      boleto_id, 
      filename, 
      filetype,
      file_data_length: file_data?.length 
    });

    if (!boleto_id || !file_data || !filename) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    // Verificar se boleto_id parece ser um UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(boleto_id);
    const isNumeric = /^\d+$/.test(boleto_id);
    
    console.log('🔍 [DEBUG] Tipo do boleto_id:', { boleto_id, isUUID, isNumeric });

    let boletoQuery;
    let queryText;
    
    if (isUUID) {
      queryText = 'SELECT numero_controle, status FROM boletos WHERE id = $1';
      console.log('🔍 [DEBUG] Query UUID:', queryText);
      boletoQuery = await pool.query(queryText, [boleto_id]);
    } else if (isNumeric) {
      queryText = 'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1';
      console.log('🔍 [DEBUG] Query Numérica:', queryText);
      boletoQuery = await pool.query(queryText, [boleto_id]);
    } else {
      queryText = 'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1';
      console.log('🔍 [DEBUG] Query Padrão:', queryText);
      boletoQuery = await pool.query(queryText, [boleto_id]);
    }

    console.log('🔍 [DEBUG] Resultado da query:', boletoQuery.rows);

    if (boletoQuery.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Boleto não encontrado',
        debug: { queryText, boleto_id, isUUID, isNumeric }
      });
    }

    const boleto = boletoQuery.rows[0];
    console.log('🔍 [DEBUG] Boleto encontrado:', boleto);

    return res.status(200).json({
      success: true,
      message: 'Debug concluído - query funcionou!',
      debug: {
        boleto_id,
        isUUID,
        isNumeric,
        queryText,
        boleto_encontrado: boleto,
        version: 'debug-v1.0'
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erro detalhado:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack,
      debug: {
        isProduction,
        hasPool: !!pool,
        version: 'debug-v1.0'
      }
    });
  }
};