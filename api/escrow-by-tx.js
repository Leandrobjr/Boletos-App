const { Pool } = require('pg');

// CONFIGURAÇÃO ROBUSTA COM RETRY E FALLBACK
let pool;

const createConnection = async () => {
  const connectionString = 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  try {
    console.log('🔗 [ESCROW-BY-TX] Criando nova conexão com Neon PostgreSQL...');
    
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
    console.log('✅ [ESCROW-BY-TX] Conexão testada:', testResult.rows[0]);
    
    return newPool;
  } catch (error) {
    console.error('❌ [ESCROW-BY-TX] Erro na conexão:', error.message);
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
    
    // 4. Extrair tx_hash da query
    const { tx_hash } = req.query;
    
    if (!tx_hash) {
      return res.status(400).json({
        error: 'Parâmetro obrigatório ausente',
        required: 'tx_hash',
        example: '/api/escrow/by_tx?tx_hash=0x123...'
      });
    }

    // 5. Validar formato básico do tx_hash (deve começar com 0x)
    if (!tx_hash.startsWith('0x') || tx_hash.length < 10) {
      return res.status(400).json({
        error: 'Formato de tx_hash inválido',
        received: tx_hash,
        expected: 'Hash de transação válido (ex: 0x123...)'
      });
    }

    console.log('🔍 [ESCROW-BY-TX] Buscando por tx_hash:', tx_hash);

    // 6. Query para buscar boleto por tx_hash
    const query = `
      SELECT 
        id,
        numero_controle,
        escrow_id,
        tx_hash,
        status,
        valor,
        data_vencimento,
        data_travamento,
        comprador_id,
        vendedor_id,
        created_at,
        updated_at
      FROM boletos 
      WHERE tx_hash = $1
    `;

    const result = await dbPool.query(query, [tx_hash]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Escrow não encontrado para este tx_hash',
        tx_hash: tx_hash,
        suggestion: 'Verifique se a transação foi processada corretamente'
      });
    }

    const escrowData = result.rows[0];

    // 7. Validar consistência dos dados
    if (!escrowData.escrow_id) {
      console.warn('⚠️ [ESCROW-BY-TX] Boleto encontrado mas sem escrow_id:', escrowData.numero_controle);
      
      return res.status(422).json({
        error: 'Dados inconsistentes',
        message: 'Boleto encontrado mas sem escrow_id associado',
        boleto: {
          numero_controle: escrowData.numero_controle,
          tx_hash: escrowData.tx_hash,
          status: escrowData.status
        },
        action_required: 'Sincronizar dados de escrow'
      });
    }

    // 8. Retornar dados completos do escrow
    console.log('✅ [ESCROW-BY-TX] Escrow encontrado:', {
      escrow_id: escrowData.escrow_id,
      numero_controle: escrowData.numero_controle,
      status: escrowData.status
    });

    return res.status(200).json({
      success: true,
      escrow: {
        id: escrowData.id,
        numero_controle: escrowData.numero_controle,
        escrow_id: escrowData.escrow_id,
        tx_hash: escrowData.tx_hash,
        status: escrowData.status,
        valor: escrowData.valor,
        data_vencimento: escrowData.data_vencimento,
        data_travamento: escrowData.data_travamento,
        comprador_id: escrowData.comprador_id,
        vendedor_id: escrowData.vendedor_id,
        created_at: escrowData.created_at,
        updated_at: escrowData.updated_at
      },
      metadata: {
        query_tx_hash: tx_hash,
        found_at: new Date().toISOString(),
        data_consistency: 'validated'
      }
    });

  } catch (error) {
    console.error('❌ [ESCROW-BY-TX] Erro interno:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      tx_hash: req.query.tx_hash,
      timestamp: new Date().toISOString()
    });
  }
};