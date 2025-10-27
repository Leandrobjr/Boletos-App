import { Pool } from 'pg';

// Configuração do banco com logs detalhados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req, res) {
  const debugLog = [];
  const startTime = Date.now();
  
  try {
    debugLog.push(`[${new Date().toISOString()}] INÍCIO - Deep Debug Iniciado`);
    debugLog.push(`[${new Date().toISOString()}] AMBIENTE: ${process.env.NODE_ENV || 'undefined'}`);
    debugLog.push(`[${new Date().toISOString()}] VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`);
    debugLog.push(`[${new Date().toISOString()}] DATABASE_URL definida: ${!!process.env.DATABASE_URL}`);
    
    // Teste 1: Verificar método HTTP
    debugLog.push(`[${new Date().toISOString()}] MÉTODO: ${req.method}`);
    if (req.method !== 'POST') {
      debugLog.push(`[${new Date().toISOString()}] ERRO: Método não permitido`);
      return res.status(405).json({ 
        error: 'Método não permitido',
        debug: debugLog,
        executionTime: Date.now() - startTime
      });
    }

    // Teste 2: Verificar body da requisição
    debugLog.push(`[${new Date().toISOString()}] BODY recebido: ${JSON.stringify(req.body).substring(0, 200)}...`);
    const { boleto_id, test_mode } = req.body;
    
    if (!boleto_id) {
      debugLog.push(`[${new Date().toISOString()}] ERRO: boleto_id não fornecido`);
      return res.status(400).json({ 
        error: 'boleto_id é obrigatório',
        debug: debugLog,
        executionTime: Date.now() - startTime
      });
    }

    debugLog.push(`[${new Date().toISOString()}] BOLETO_ID: ${boleto_id} (tipo: ${typeof boleto_id})`);
    debugLog.push(`[${new Date().toISOString()}] TEST_MODE: ${test_mode}`);

    // Teste 3: Verificar conexão com banco
    debugLog.push(`[${new Date().toISOString()}] TESTANDO conexão com banco...`);
    let client;
    
    try {
      const connectionStart = Date.now();
      client = await pool.connect();
      debugLog.push(`[${new Date().toISOString()}] CONEXÃO estabelecida em ${Date.now() - connectionStart}ms`);
    } catch (connectionError) {
      debugLog.push(`[${new Date().toISOString()}] ERRO DE CONEXÃO: ${connectionError.message}`);
      debugLog.push(`[${new Date().toISOString()}] STACK: ${connectionError.stack}`);
      return res.status(500).json({ 
        error: 'Erro de conexão com banco',
        details: connectionError.message,
        debug: debugLog,
        executionTime: Date.now() - startTime
      });
    }

    // Teste 4: Verificar se a tabela existe
    try {
      debugLog.push(`[${new Date().toISOString()}] VERIFICANDO se tabela 'boletos' existe...`);
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'boletos'
        );
      `);
      debugLog.push(`[${new Date().toISOString()}] TABELA existe: ${tableCheck.rows[0].exists}`);
      
      if (!tableCheck.rows[0].exists) {
        throw new Error('Tabela boletos não existe');
      }
    } catch (tableError) {
      debugLog.push(`[${new Date().toISOString()}] ERRO verificando tabela: ${tableError.message}`);
      client.release();
      return res.status(500).json({ 
        error: 'Erro verificando estrutura do banco',
        details: tableError.message,
        debug: debugLog,
        executionTime: Date.now() - startTime
      });
    }

    // Teste 5: Verificar estrutura da tabela
    try {
      debugLog.push(`[${new Date().toISOString()}] VERIFICANDO estrutura da tabela...`);
      const columnCheck = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'boletos' 
        ORDER BY ordinal_position;
      `);
      debugLog.push(`[${new Date().toISOString()}] COLUNAS encontradas: ${columnCheck.rows.length}`);
      columnCheck.rows.forEach(col => {
        debugLog.push(`[${new Date().toISOString()}] - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (structureError) {
      debugLog.push(`[${new Date().toISOString()}] ERRO verificando estrutura: ${structureError.message}`);
    }

    // Teste 6: Query simples de contagem
    try {
      debugLog.push(`[${new Date().toISOString()}] EXECUTANDO query de contagem...`);
      const countQuery = 'SELECT COUNT(*) as total FROM boletos';
      const countResult = await client.query(countQuery);
      debugLog.push(`[${new Date().toISOString()}] TOTAL de boletos: ${countResult.rows[0].total}`);
    } catch (countError) {
      debugLog.push(`[${new Date().toISOString()}] ERRO na contagem: ${countError.message}`);
      debugLog.push(`[${new Date().toISOString()}] STACK: ${countError.stack}`);
    }

    // Teste 7: Query específica do boleto (versão segura)
    try {
      debugLog.push(`[${new Date().toISOString()}] EXECUTANDO query específica do boleto...`);
      
      // Primeiro, vamos tentar diferentes abordagens para o boleto_id
      const queries = [
        {
          name: 'Query com CAST para VARCHAR',
          sql: 'SELECT id, valor, status FROM boletos WHERE CAST(id AS VARCHAR) = $1 LIMIT 1',
          param: String(boleto_id)
        },
        {
          name: 'Query com conversão ::text',
          sql: 'SELECT id, valor, status FROM boletos WHERE id::text = $1 LIMIT 1',
          param: String(boleto_id)
        },
        {
          name: 'Query direta (assumindo id numérico)',
          sql: 'SELECT id, valor, status FROM boletos WHERE id = $1 LIMIT 1',
          param: parseInt(boleto_id)
        },
        {
          name: 'Query com LIKE',
          sql: 'SELECT id, valor, status FROM boletos WHERE id::text LIKE $1 LIMIT 1',
          param: String(boleto_id)
        }
      ];

      let successfulQuery = null;
      
      for (const queryTest of queries) {
        try {
          debugLog.push(`[${new Date().toISOString()}] TESTANDO: ${queryTest.name}`);
          debugLog.push(`[${new Date().toISOString()}] SQL: ${queryTest.sql}`);
          debugLog.push(`[${new Date().toISOString()}] PARAM: ${queryTest.param} (tipo: ${typeof queryTest.param})`);
          
          const queryStart = Date.now();
          const result = await client.query(queryTest.sql, [queryTest.param]);
          const queryTime = Date.now() - queryStart;
          
          debugLog.push(`[${new Date().toISOString()}] SUCESSO em ${queryTime}ms - Linhas: ${result.rows.length}`);
          
          if (result.rows.length > 0) {
            debugLog.push(`[${new Date().toISOString()}] BOLETO encontrado: ${JSON.stringify(result.rows[0])}`);
            successfulQuery = queryTest.name;
            break;
          } else {
            debugLog.push(`[${new Date().toISOString()}] NENHUM boleto encontrado com esta query`);
          }
          
        } catch (queryError) {
          debugLog.push(`[${new Date().toISOString()}] ERRO na ${queryTest.name}: ${queryError.message}`);
          debugLog.push(`[${new Date().toISOString()}] CÓDIGO do erro: ${queryError.code}`);
          debugLog.push(`[${new Date().toISOString()}] DETALHE: ${queryError.detail || 'N/A'}`);
        }
      }
      
      if (!successfulQuery) {
        debugLog.push(`[${new Date().toISOString()}] NENHUMA query funcionou para encontrar o boleto`);
      } else {
        debugLog.push(`[${new Date().toISOString()}] QUERY VENCEDORA: ${successfulQuery}`);
      }
      
    } catch (mainError) {
      debugLog.push(`[${new Date().toISOString()}] ERRO GERAL nas queries: ${mainError.message}`);
      debugLog.push(`[${new Date().toISOString()}] STACK: ${mainError.stack}`);
    }

    // Teste 8: Verificar alguns boletos existentes
    try {
      debugLog.push(`[${new Date().toISOString()}] LISTANDO alguns boletos existentes...`);
      const sampleQuery = 'SELECT id, valor, status FROM boletos ORDER BY id DESC LIMIT 5';
      const sampleResult = await client.query(sampleQuery);
      debugLog.push(`[${new Date().toISOString()}] AMOSTRAS encontradas: ${sampleResult.rows.length}`);
      sampleResult.rows.forEach((row, index) => {
        debugLog.push(`[${new Date().toISOString()}] Amostra ${index + 1}: ID=${row.id} (tipo: ${typeof row.id}), Valor=${row.valor}, Status=${row.status}`);
      });
    } catch (sampleError) {
      debugLog.push(`[${new Date().toISOString()}] ERRO listando amostras: ${sampleError.message}`);
    }

    client.release();
    debugLog.push(`[${new Date().toISOString()}] CONEXÃO liberada`);
    debugLog.push(`[${new Date().toISOString()}] FIM - Debug concluído`);

    return res.status(200).json({
      success: true,
      message: 'Debug profundo concluído',
      debug: debugLog,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    debugLog.push(`[${new Date().toISOString()}] ERRO FATAL: ${error.message}`);
    debugLog.push(`[${new Date().toISOString()}] STACK COMPLETO: ${error.stack}`);
    
    return res.status(500).json({
      error: 'Erro fatal no debug',
      message: error.message,
      debug: debugLog,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  }
}