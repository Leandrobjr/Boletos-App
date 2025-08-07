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
    console.log('🔍 DATABASE_URL configurado:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
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