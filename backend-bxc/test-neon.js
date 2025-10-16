const { Pool } = require('pg');
require('dotenv').config();

console.log('🧪 Testando conexão Neon...');

// String de conexão direta do Neon (SENHA CORRIGIDA)
const connectionString = 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('🔍 String de conexão:', connectionString);

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Testar conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro:', err.message);
  } else {
    console.log('✅ Conectado com sucesso!');
    console.log('⏰ Hora do servidor:', res.rows[0].now);
  }
  pool.end();
}); 