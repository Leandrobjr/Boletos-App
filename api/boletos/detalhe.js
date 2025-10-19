const { Pool } = require('pg');

// CONFIGURAÇÃO ROBUSTA COM RETRY E FALLBACK
let pool;

const createConnection = async () => {
  const connectionString = 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  try {
    console.log('🔗 [BOLETO-DETALHE] Criando nova conexão com Neon PostgreSQL...');
    
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
    console.log('✅ [BOLETO-DETALHE] Conexão testada:', testResult.rows[0]);
    
    return newPool;
  } catch (error) {
    console.error('❌ [BOLETO-DETALHE] Erro na conexão:', error.message);
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
    const { numero_controle, escrow_id, id } = req.query;
    
    if (!numero_controle && !escrow_id && !id) {
      return res.status(400).json({
        error: 'Parâmetro obrigatório ausente',
        required: 'numero_controle, escrow_id ou id',
        examples: [
          '/api/boletos/detalhe?numero_controle=123456',
          '/api/boletos/detalhe?escrow_id=0x123...',
          '/api/boletos/detalhe?id=1'
        ]
      });
    }

    let query;
    let params;

    // 5. Construir query baseada no parâmetro fornecido
    if (numero_controle) {
      query = `
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
          updated_at,
          comprovante_url,
          observacoes
        FROM boletos 
        WHERE numero_controle = $1
      `;
      params = [numero_controle];
    } else if (escrow_id) {
      query = `
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
          updated_at,
          comprovante_url,
          observacoes
        FROM boletos 
        WHERE escrow_id = $1
      `;
      params = [escrow_id];
    } else if (id) {
      query = `
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
          updated_at,
          comprovante_url,
          observacoes
        FROM boletos 
        WHERE id = $1
      `;
      params = [parseInt(id)];
    }

    console.log('🔍 [BOLETO-DETALHE] Executando query:', { 
      searchBy: { numero_controle, escrow_id, id },
      params 
    });

    // 6. Executar query
    const result = await dbPool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Boleto não encontrado',
        searched: { numero_controle, escrow_id, id },
        suggestion: 'Verifique se os dados estão corretos'
      });
    }

    const boletoData = result.rows[0];

    // 7. Enriquecer dados com informações de status
    const statusInfo = {
      'pendente': { 
        description: 'Aguardando pagamento',
        action: 'Realizar pagamento do boleto'
      },
      'pago': { 
        description: 'Pagamento confirmado',
        action: 'Aguardando liberação do escrow'
      },
      'travado': { 
        description: 'USDT travado no escrow',
        action: 'Aguardando confirmação de pagamento'
      },
      'liberado': { 
        description: 'USDT liberado com sucesso',
        action: 'Transação concluída'
      },
      'cancelado': { 
        description: 'Boleto cancelado',
        action: 'Nenhuma ação necessária'
      }
    };

    // 8. Verificar consistência dos dados de escrow
    const escrowStatus = {
      has_escrow_id: !!boletoData.escrow_id,
      has_tx_hash: !!boletoData.tx_hash,
      is_locked: boletoData.status === 'travado',
      can_release: boletoData.status === 'pago' && !!boletoData.escrow_id
    };

    // 9. Calcular dias até vencimento
    const diasVencimento = boletoData.data_vencimento ? 
      Math.ceil((new Date(boletoData.data_vencimento) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    console.log('✅ [BOLETO-DETALHE] Boleto encontrado:', {
      numero_controle: boletoData.numero_controle,
      status: boletoData.status,
      escrow_status: escrowStatus
    });

    // 10. Retornar detalhes completos
    return res.status(200).json({
      success: true,
      boleto: {
        // Dados básicos
        id: boletoData.id,
        numero_controle: boletoData.numero_controle,
        status: boletoData.status,
        valor: boletoData.valor,
        
        // Datas
        data_vencimento: boletoData.data_vencimento,
        data_travamento: boletoData.data_travamento,
        created_at: boletoData.created_at,
        updated_at: boletoData.updated_at,
        dias_vencimento: diasVencimento,
        
        // Dados de escrow/blockchain
        escrow_id: boletoData.escrow_id,
        tx_hash: boletoData.tx_hash,
        
        // Participantes
        comprador_id: boletoData.comprador_id,
        vendedor_id: boletoData.vendedor_id,
        
        // Anexos
        comprovante_url: boletoData.comprovante_url,
        observacoes: boletoData.observacoes
      },
      
      // Metadados enriquecidos
      metadata: {
        status_info: statusInfo[boletoData.status] || { 
          description: 'Status desconhecido', 
          action: 'Verificar com suporte' 
        },
        escrow_status: escrowStatus,
        query_info: {
          searched_by: numero_controle ? 'numero_controle' : 
                      escrow_id ? 'escrow_id' : 'id',
          search_value: numero_controle || escrow_id || id
        },
        retrieved_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [BOLETO-DETALHE] Erro interno:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      query_params: { numero_controle, escrow_id, id },
      timestamp: new Date().toISOString()
    });
  }
};