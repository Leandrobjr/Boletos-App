const { Pool } = require('pg');

// CORS Headers obrigatórios
function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// Configuração do banco
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

const pool = new Pool({
  connectionString: `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  statement_timeout: 10000
});

async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise(resolve => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => {
      try { 
        resolve(JSON.parse(data || '{}')); 
      } catch { 
        resolve({}); 
      }
    });
  });
}

module.exports = async (req, res) => {
  console.log('🔒 RESERVAR BOLETO - Iniciando função...');
  console.log('📝 Método:', req.method);
  console.log('🔗 URL:', req.url);
  console.log('📋 Query:', req.query);
  
  // Aplicar CORS
  applyCors(req, res);
  
  // Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS - Retornando CORS');
    return res.status(200).end();
  }
  
  // Apenas PATCH é permitido
  if (req.method !== 'PATCH') {
    console.error('❌ Método não permitido:', req.method);
    return res.status(405).json({ 
      error: 'Método não permitido', 
      allowed: ['PATCH'],
      received: req.method
    });
  }

  try {
    // Extrair numero_controle da URL
    const { numero_controle } = req.query;
    console.log('🔍 Numero controle recebido:', numero_controle);
    
    // Parse do body
    const body = await getJsonBody(req);
    console.log('📦 Body recebido:', body);
    
    const { user_id, wallet_address, tx_hash } = body;
    
    // Validações
    if (!numero_controle) {
      console.error('❌ Numero controle não fornecido');
      return res.status(400).json({ 
        error: 'Numero controle é obrigatório',
        received: req.query
      });
    }
    
    if (!user_id || !wallet_address) {
      console.error('❌ Dados obrigatórios ausentes:', { user_id, wallet_address });
      return res.status(400).json({ 
        error: 'Dados obrigatórios ausentes', 
        required: ['user_id', 'wallet_address'],
        received: { user_id: !!user_id, wallet_address: !!wallet_address }
      });
    }

    console.log('🔍 Buscando boleto com numero_controle:', numero_controle);
    
    // Buscar boleto por numero_controle
    const checkQuery = 'SELECT * FROM boletos WHERE numero_controle = $1';
    const checkResult = await pool.query(checkQuery, [numero_controle]);
    
    console.log('📊 Resultado da busca:', {
      rowCount: checkResult.rowCount,
      found: checkResult.rowCount > 0
    });
    
    if (checkResult.rowCount === 0) {
      console.error('❌ Boleto não encontrado para numero_controle:', numero_controle);
      return res.status(404).json({ 
        error: 'Boleto não encontrado', 
        numero_controle: numero_controle
      });
    }

    const boleto = checkResult.rows[0];
    console.log('📄 Boleto encontrado:', {
      id: boleto.id,
      numero_controle: boleto.numero_controle,
      status: boleto.status,
      valor_usdt: boleto.valor_usdt
    });
    
    // Verificar se está disponível
    if (boleto.status !== 'DISPONIVEL') {
      console.error('❌ Boleto não está disponível:', {
        current_status: boleto.status,
        expected: 'DISPONIVEL'
      });
      return res.status(400).json({ 
        error: 'Boleto não disponível para reserva', 
        current_status: boleto.status,
        expected: 'DISPONIVEL'
      });
    }

    console.log('🔄 Atualizando status do boleto para AGUARDANDO PAGAMENTO...');
    
    // Atualizar status para AGUARDANDO PAGAMENTO - MANTER user_id original do vendedor
    const updateQuery = `
      UPDATE boletos 
      SET status = $1, comprador_id = $2, wallet_address = $3, tx_hash = $4
      WHERE numero_controle = $5 AND status = $6 
      RETURNING *
    `;
    
    console.log('📋 Parâmetros do UPDATE:', {
      status: 'AGUARDANDO PAGAMENTO',
      comprador_id: user_id,
      wallet_address: wallet_address,
      tx_hash: tx_hash || null,
      numero_controle: numero_controle,
      status_atual: 'DISPONIVEL'
    });
    
    const updateResult = await pool.query(updateQuery, [
      'AGUARDANDO PAGAMENTO', 
      user_id,           // ID do comprador (nova coluna comprador_id)
      wallet_address,    // Endereço da carteira do comprador
      tx_hash || null,   // Hash da transação de travamento
      numero_controle,   // Numero de controle do boleto
      'DISPONIVEL'       // Status atual deve ser DISPONIVEL
    ]);
    
    console.log('📊 Resultado da atualização:', {
      rowCount: updateResult.rowCount,
      updated: updateResult.rowCount > 0
    });

    if (updateResult.rowCount === 0) {
      console.error('❌ Conflito - Boleto não está mais disponível');
      return res.status(409).json({ 
        error: 'Conflito ao reservar boleto', 
        message: 'Boleto não está mais disponível ou já foi reservado por outro usuário'
      });
    }

    const boletoAtualizado = updateResult.rows[0];
    console.log('✅ Boleto reservado com sucesso:', {
      id: boletoAtualizado.id,
      numero_controle: boletoAtualizado.numero_controle,
      status: boletoAtualizado.status,
      wallet_address: boletoAtualizado.wallet_address
    });

    return res.status(200).json({ 
      success: true, 
      data: boletoAtualizado, 
      message: 'Boleto reservado com sucesso!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO em reservar boleto:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
