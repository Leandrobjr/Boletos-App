const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Verificar se as variáveis de ambiente estão configuradas
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_xxxxxxxxxxxx';
const dbName = process.env.DB_NAME || 'neondb';

console.log('🚀 DEBUG: Iniciando backend Vercel -', new Date().toISOString());
console.log('🔍 DB_HOST:', dbHost);
console.log('🔍 DB_USER:', dbUser);
console.log('🔍 DB_PASS configurado:', dbPass ? 'Sim' : 'Não');
console.log('🔍 DB_NAME:', dbName);

// Configuração do Neon PostgreSQL
let pool;
try {
  const connectionString = `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`;
  console.log('🔍 String de conexão construída');
  
  pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });
  console.log('✅ Pool de conexão criado com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar pool de conexão:', error);
}

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend BXC funcionando!', 
    timestamp: new Date().toISOString(),
    database: process.env.DB_HOST ? 'Configurado' : 'Não configurado'
  });
});

// Rota de teste para verificar se o servidor está funcionando
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Teste funcionando!', 
    timestamp: new Date().toISOString()
  });
});

// Exportar para Vercel Functions
module.exports = app; 
