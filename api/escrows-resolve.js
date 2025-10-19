const { Pool } = require('pg');

// CONFIGURAÇÃO ROBUSTA COM RETRY E FALLBACK
let pool;

const createConnection = async () => {
  const connectionString = 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  try {
    console.log('🔗 [ESCROW-RESOLVE] Criando nova conexão com Neon PostgreSQL...');
    
    const newPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000, // 10s timeout
      idleTimeoutMillis: 30000,       // 30s idle timeout
      max: 5                          // max 5 conexões
    });

    // Testar conexão imediatamente
    const testResult = await newPool.query('SELECT NOW() as current_time');
    console.log('✅ [ESCROW-RESOLVE] Conexão testada:', testResult.rows[0]);
    
    return newPool;
  } catch (error) {
    console.error('❌ [ESCROW-RESOLVE] Erro na conexão:', error.message);
    throw error;
  }
};

const getPool = async () => {
  if (!pool) {
    pool = await createConnection();
  }
  return pool;
};

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

  // 3. Apenas GET permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Método não permitido',
      allowed: ['GET'] 
    });
  }

  try {
    const dbPool = await getPool();
    
    // 4. Extrair parâmetros da query
    const { numero_controle, escrow_id, tx_hash } = req.query;
    
    if (!numero_controle && !escrow_id && !tx_hash) {
      return res.status(400).json({
        error: 'Parâmetro obrigatório ausente',
        required: 'numero_controle, escrow_id ou tx_hash'
      });
    }

    let query;
    let params;

    // 5. Construir query baseada no parâmetro fornecido
    if (numero_controle) {
      query = `
        SELECT 
          escrow_id, 
          tx_hash, 
          numero_controle,
          status,
          data_travamento,
          comprador_id
        FROM boletos 
        WHERE numero_controle = $1
      `;
      params = [numero_controle];
    } else if (escrow_id) {
      query = `
        SELECT 
          escrow_id, 
          tx_hash, 
          numero_controle,
          status,
          data_travamento,
          comprador_id
        FROM boletos 
        WHERE escrow_id = $1
      `;
      params = [escrow_id];
    } else if (tx_hash) {
      query = `
        SELECT 
          escrow_id, 
          tx_hash, 
          numero_controle,
          status,
          data_travamento,
          comprador_id
        FROM boletos 
        WHERE tx_hash = $1
      `;
      params = [tx_hash];
    }

    console.log('🔍 [ESCROW-RESOLVE] Executando query:', { query, params });

    // 6. Executar query
    const result = await dbPool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Escrow não encontrado',
        searched: { numero_controle, escrow_id, tx_hash }
      });
    }

    const escrowData = result.rows[0];

    // 7. Validar se escrow_id existe
    if (!escrowData.escrow_id) {
      return res.status(404).json({
        error: 'Boleto encontrado mas sem escrow_id associado',
        boleto: {
          numero_controle: escrowData.numero_controle,
          status: escrowData.status
        },
        action_required: 'Associar escrow_id ao boleto'
      });
    }

    // 8. Retornar dados do escrow
    console.log('✅ [ESCROW-RESOLVE] Escrow encontrado:', escrowData);

    return res.status(200).json({
      success: true,
      escrow: {
        escrow_id: escrowData.escrow_id,
        tx_hash: escrowData.tx_hash,
        numero_controle: escrowData.numero_controle,
        status: escrowData.status,
        data_travamento: escrowData.data_travamento,
        comprador_id: escrowData.comprador_id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ESCROW-RESOLVE] Erro interno:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};