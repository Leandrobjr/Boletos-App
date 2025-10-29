/**
 * 🔍 DEBUG VERSION - Upload de comprovantes com logs extremamente detalhados
 * Endpoint: POST /api/debug-upload
 */

const { put } = require('@vercel/blob');
const { Pool } = require('pg');

// Configuração do banco PostgreSQL para produção
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  console.log('🔍 DEBUG: Iniciando debug-upload...');
  console.log('🔍 DEBUG: Method:', req.method);
  console.log('🔍 DEBUG: Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 DEBUG: URL:', req.url);
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('🔍 DEBUG: Respondendo OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('🔍 DEBUG: Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 DEBUG: Body type:', typeof req.body);
    console.log('🔍 DEBUG: Body keys:', req.body ? Object.keys(req.body) : 'null');
    console.log('🔍 DEBUG: Body content:', JSON.stringify(req.body, null, 2));
    
    const { boleto_id, file_data, filename, filetype } = req.body;
    
    // CORREÇÃO: Tratar boleto_id como numero_controle
    const numero_controle = boleto_id;
    
    console.log('🔍 DEBUG: boleto_id recebido:', boleto_id, 'type:', typeof boleto_id);
    console.log('🔍 DEBUG: tratando como numero_controle:', numero_controle);
    console.log('🔍 DEBUG: filename:', filename);
    console.log('🔍 DEBUG: filetype:', filetype);
    console.log('🔍 DEBUG: file_data length:', file_data ? file_data.length : 'null');

    if (!numero_controle || !file_data || !filename) {
      console.log('🔍 DEBUG: Dados obrigatórios ausentes');
      return res.status(400).json({ 
        error: 'Dados obrigatórios: numero_controle, file_data, filename',
        debug: { numero_controle: !!numero_controle, file_data: !!file_data, filename: !!filename }
      });
    }

    // Teste de conexão com o banco
    console.log('🔍 DEBUG: Testando conexão com banco...');
    try {
      const testQuery = await pool.query('SELECT NOW() as current_time');
      console.log('🔍 DEBUG: Conexão OK, timestamp:', testQuery.rows[0].current_time);
    } catch (connError) {
      console.error('🔍 DEBUG: Erro de conexão:', connError.message);
      return res.status(500).json({ 
        error: 'Erro de conexão com banco',
        details: connError.message
      });
    }

    // CORREÇÃO: Simplificar - sempre usar numero_controle
    const numeroControleStr = String(numero_controle).trim();
    
    console.log('🔍 DEBUG: Processando numero_controle:', {
      original: numero_controle,
      string: numeroControleStr,
      length: numeroControleStr.length
    });

    // Teste simples de query primeiro
    console.log('🔍 DEBUG: Testando query simples...');
    try {
      const simpleTest = await pool.query('SELECT COUNT(*) as total FROM boletos');
      console.log('🔍 DEBUG: Total de boletos na tabela:', simpleTest.rows[0].total);
    } catch (simpleError) {
      console.error('🔍 DEBUG: Erro na query simples:', simpleError.message);
      return res.status(500).json({ 
        error: 'Erro na query simples',
        details: simpleError.message
      });
    }

    // CORREÇÃO: Buscar sempre por numero_controle
    let boletoQuery;
    console.log('🔍 DEBUG: Executando query de busca por numero_controle...');
    
    try {
      const numeroControle = parseInt(numeroControleStr);
      console.log('🔍 DEBUG: Buscando por numero_controle:', numeroControle);
      
      boletoQuery = await pool.query(
        'SELECT id, numero_controle, status FROM boletos WHERE numero_controle = $1',
        [numeroControle]
      );
      console.log('🔍 DEBUG: Query executada com sucesso, resultados:', boletoQuery.rows.length);
    } catch (queryError) {
      console.error('🔍 DEBUG: ERRO NA QUERY DE BUSCA:', queryError.message);
      console.error('🔍 DEBUG: Stack trace:', queryError.stack);
      console.error('🔍 DEBUG: Query details:', {
        numeroControleStr,
        numeroControle: parseInt(numeroControleStr),
        originalBoletoId: boleto_id
      });
      
      return res.status(500).json({ 
        error: 'Erro na query de busca',
        details: queryError.message,
        debug: {
          numeroControleStr,
          numeroControle: parseInt(numeroControleStr),
          originalBoletoId: boleto_id,
          stack: queryError.stack
        }
      });
    }

    console.log('🔍 DEBUG: Boletos encontrados:', boletoQuery.rows.length);
    
    if (boletoQuery.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Boleto não encontrado',
        debug: { numero_controle: numeroControleStr }
      });
    }

    const boleto = boletoQuery.rows[0];
    console.log('🔍 DEBUG: Boleto encontrado:', JSON.stringify(boleto, null, 2));

    // Se chegou até aqui, o problema não é na busca
    return res.status(200).json({
      success: true,
      message: 'Debug concluído - busca funcionou',
      debug: {
        boleto_found: boleto,
        analysis: { isNumeric, isUUID, boletoIdStr }
      }
    });

  } catch (error) {
    console.error('🔍 DEBUG: ERRO GERAL:', error.message);
    console.error('🔍 DEBUG: Stack trace completo:', error.stack);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
  }
};