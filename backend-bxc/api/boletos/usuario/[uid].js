const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
    // 🔄 VERIFICAÇÃO AUTOMÁTICA DE BOLETOS EXPIRADOS (60 MINUTOS)
    try {
      const agora = new Date();
      const limite60Minutos = new Date(agora.getTime() - (60 * 60 * 1000)); // 60 minutos atrás
      
      // Buscar boletos expirados (AGUARDANDO_PAGAMENTO há mais de 60 minutos)
      const boletosExpirados = await pool.query(`
        SELECT id, numero_controle, status, data_travamento
        FROM boletos
        WHERE status = 'AGUARDANDO_PAGAMENTO'
        AND data_travamento IS NOT NULL
        AND data_travamento <= $1
      `, [limite60Minutos.toISOString()]);
      
      if (boletosExpirados.rowCount > 0) {
        console.log(`🔄 [AUTO-DESTRAVAR] Encontrados ${boletosExpirados.rowCount} boletos expirados`);
        
        // Destravar cada boleto expirado
        for (const boleto of boletosExpirados.rows) {
          try {
            await pool.query(`
              UPDATE boletos
              SET status = 'DISPONIVEL',
                  data_destravamento = $1,
                  comprador_id = NULL,
                  wallet_address = NULL,
                  data_travamento = NULL
              WHERE id = $2
            `, [agora.toISOString(), boleto.id]);
            
            console.log(`✅ [AUTO-DESTRAVAR] Boleto ${boleto.numero_controle} destravado automaticamente`);
          } catch (error) {
            console.error(`❌ [AUTO-DESTRAVAR] Erro ao destravar boleto ${boleto.id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ [AUTO-DESTRAVAR] Erro na verificação automática:', error.message);
    }

    // Extrair UID da query string ou URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const uid = url.searchParams.get('uid') || url.pathname.split('/').pop();

    console.log(`🚀 API Boletos Usuario [UID] Request: ${req.method} ${req.url}, UID: ${uid}`);

    if (!uid || uid === 'usuario') {
      res.status(400).json({
        error: 'UID é obrigatório',
        message: 'Parâmetro uid não fornecido na URL'
      });
      return;
    }

    if (req.method === 'GET') {
      // Debug: verificar estrutura da tabela boletos
      const tableInfo = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'boletos'");
      console.log('📍 Estrutura da tabela boletos:', tableInfo.rows);
      
      // Buscar TODOS os boletos do usuário (independente do status)
      const result = await pool.query(
        'SELECT * FROM boletos WHERE user_id = $1 ORDER BY criado_em DESC',
        [uid]
      );
      
      console.log(`🔍 [USUARIO] Encontrados ${result.rowCount} boletos para usuário ${uid}`);
      
      // Se não encontrou por user_id, tentar por comprador_id (caso o usuário seja comprador)
      if (result.rowCount === 0) {
        console.log('🔄 [USUARIO] Tentando buscar por comprador_id...');
        const resultComprador = await pool.query(
          'SELECT * FROM boletos WHERE comprador_id = $1 ORDER BY criado_em DESC',
          [uid]
        );
        console.log(`🔍 [COMPRADOR] Encontrados ${resultComprador.rowCount} boletos como comprador`);
        
        // Se ainda não encontrou, buscar TODOS os boletos (para debug)
        if (resultComprador.rowCount === 0) {
          console.log('🔄 [DEBUG] Buscando TODOS os boletos para debug...');
          const todosBoletos = await pool.query('SELECT * FROM boletos ORDER BY criado_em DESC LIMIT 10');
          console.log(`🔍 [DEBUG] Encontrados ${todosBoletos.rowCount} boletos na tabela`);
          
          res.status(200).json({
            success: true,
            data: todosBoletos.rows,
            count: todosBoletos.rowCount,
            debug: {
              user_id_results: result.rowCount,
              comprador_id_results: resultComprador.rowCount,
              total_boletos: todosBoletos.rowCount,
              uid_buscado: uid,
              message: 'Retornando todos os boletos para debug'
            }
          });
          return;
        }
        
        // Retornar resultados do comprador
        res.status(200).json({
          success: true,
          data: resultComprador.rows,
          count: resultComprador.rowCount,
          debug: {
            user_id_results: result.rowCount,
            comprador_id_results: resultComprador.rowCount
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount,
        usuario_id: uid
      });

    } else if (req.method === 'POST') {
      // Criar boleto para o usuário
      const { numero_controle, valor, vencimento, descricao } = req.body;

      if (!numero_controle || !valor) {
        return res.status(400).json({
          error: 'Dados obrigatórios faltando',
          required: ['numero_controle', 'valor']
        });
      }

      const result = await pool.query(
        'INSERT INTO boletos (numero_controle, valor, vencimento, user_id, descricao, status, criado_em) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
        [numero_controle, valor, vencimento, uid, descricao, 'DISPONIVEL']
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto criado com sucesso'
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'POST', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos Usuario [UID]:', error);
    // Garantir headers CORS mesmo em erro
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}; 