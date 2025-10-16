const { Pool } = require('pg');

// Configuração do banco com fallback seguro (evita localhost em produção)
const resolveDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
  if (envUrl && !isLocal) return envUrl;
  // Fallback para Neon já usado no projeto (mesma string de api/index.js)
  return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
};

const pool = new Pool({
  connectionString: resolveDatabaseUrl(),
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
    console.log(`🚀 API Boletos Comprados Request: ${req.method} ${req.url}`);
    
    if (req.method === 'GET') {
      // Extrair UID da URL (como faz a API do vendedor)
      const url = new URL(req.url, `http://${req.headers.host}`);
      const uid = url.searchParams.get('uid') || url.pathname.split('/').pop();
      
      // Debug: Log da URL completa para verificar parâmetros
      console.log('🔍 URL completa:', req.url);
      console.log('🔍 Parâmetros da URL:', url.searchParams.toString());
      
      console.log('🔍 Buscando boletos comprados pelo usuário:', uid);
      
      if (!uid || uid === 'comprados') {
        return res.status(400).json({
          error: 'UID do usuário é obrigatório',
          message: 'Forneça o UID do usuário para buscar seus boletos comprados'
        });
      }
      
      // SOLUÇÃO DEFINITIVA: Buscar por comprador_id
      // Sistema agora separa vendedor (user_id) de comprador (comprador_id)
      console.log('🔍 [DEFINITIVO] Buscando boletos comprados pelo usuário:', uid);
      
      // Verificar se a coluna comprador_id existe
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'boletos' 
        AND column_name = 'comprador_id'
      `);

      if (columnCheck.rowCount === 0) {
        console.log('❌ [ALERTA] Coluna comprador_id não existe. Evitando 500 e retornando lista vazia com flag de migração.');
        return res.status(200).json({
          success: true,
          data: [],
          count: 0,
          migrationRequired: true,
          message: 'Coluna comprador_id ausente. Execute /api/migrate/add-comprador-id.'
        });
      }

      // Buscar boletos comprados pelo usuário
      const result = await pool.query(
        `SELECT * FROM boletos 
         WHERE comprador_id = $1 
         AND status IN ('PENDENTE_PAGAMENTO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_BAIXA', 'BAIXADO', 'AGUARDANDO PAGAMENTO')
         ORDER BY criado_em DESC`,
        [uid]
      );
      
      console.log('✅ Boletos encontrados:', result.rowCount);
      
      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos Comprados:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
  }
};