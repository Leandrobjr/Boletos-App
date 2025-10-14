const { Pool } = require('pg');

// Usa o mesmo fallback seguro adotado nas rotas principais
const resolveDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
  if (envUrl && !isLocal) return envUrl;
  return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
};

const usedUrl = resolveDatabaseUrl();
const pool = new Pool({
  connectionString: usedUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    console.log('🔍 Testando conexão com banco de dados...');
    
    // Testar conexão básica
    const testQuery = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', testQuery.rows[0]);
    
    // Buscar especificamente o boleto 175009135592
    const boletoQuery = await pool.query(
      'SELECT id, numero_controle, status, comprovante_url FROM boletos WHERE numero_controle = $1',
      ['175009135592']
    );
    
    console.log(`📊 Busca por boleto 175009135592: ${boletoQuery.rowCount} resultado(s)`);
    
    if (boletoQuery.rowCount > 0) {
      console.log('✅ Boleto encontrado:', boletoQuery.rows[0]);
    } else {
      console.log('❌ Boleto não encontrado');
      
      // Listar alguns boletos para debug
      const sampleQuery = await pool.query(
        'SELECT id, numero_controle, status FROM boletos ORDER BY criado_em DESC LIMIT 5'
      );
      console.log('📋 Últimos 5 boletos:', sampleQuery.rows);
    }
    
    res.status(200).json({
      success: true,
      database_connected: true,
      current_time: testQuery.rows[0].current_time,
      boleto_175009135592: boletoQuery.rows[0] || null,
      boleto_found: boletoQuery.rowCount > 0,
      sample_boletos: await pool.query('SELECT id, numero_controle, status FROM boletos ORDER BY criado_em DESC LIMIT 3').then(r => r.rows),
      database_url_source: /localhost|127\.0\.0\.1/i.test(process.env.DATABASE_URL || '') ? 'fallback_neon' : 'env_or_fallback',
      database_url_preview: usedUrl.replace(/:[^:@/]+@/,'://****:****@').slice(0, 60) + '...'
    });

  } catch (error) {
    console.error('❌ Erro no teste de banco:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      database_url_configured: !!process.env.DATABASE_URL,
      database_url_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT_SET'
    });
  }
};
