// Teste de conexão com banco de dados
const { Pool } = require('pg');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
    const dbUser = process.env.DB_USER || 'neondb_owner';
    const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
    const dbName = process.env.DB_NAME || 'neondb';

    console.log('🔍 DB_HOST:', dbHost);
    console.log('🔍 DB_USER:', dbUser);
    console.log('🔍 DB_PASS configurado:', dbPass ? 'SIM' : 'NÃO');
    console.log('🔍 DB_NAME:', dbName);
    
    // Construir string de conexão a partir de variáveis separadas
    const connectionString = `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`;
    
    const pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('🔍 Tentando conectar ao banco...');
    const client = await pool.connect();
    console.log('✅ Conexão com banco estabelecida!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query executada:', result.rows[0]);
    
    client.release();
    await pool.end();
    
    res.json({
      message: 'Conexão com banco funcionando!',
      timestamp: new Date().toISOString(),
      database_time: result.rows[0].current_time,
      database_url_configured: !!process.env.DATABASE_URL
    });
    
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error);
    res.status(500).json({
      error: 'Erro na conexão com banco',
      details: error.message,
      database_url_configured: !!process.env.DATABASE_URL
    });
  }
}; 