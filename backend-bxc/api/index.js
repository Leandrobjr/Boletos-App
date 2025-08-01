<<<<<<< HEAD
const { Pool } = require('pg');

// Configuração do banco Neon PostgreSQL
const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_USER || 'neondb_owner'}:${process.env.DB_PASS || 'npg_dPQtsIq53OVc'}@${process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech'}/${process.env.DB_NAME || 'neondb'}?sslmode=require`,
  ssl: {
    rejectUnauthorized: false
  }
});

// Função utilitária para queries
async function runQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return { id: result.rows[0]?.id, changes: result.rowCount, rows: result.rows };
  } finally {
    client.release();
  }
}

async function getQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function allQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Inicializar tabelas
async function initDb() {
  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        firebase_uid TEXT PRIMARY KEY,
        nome TEXT,
        email TEXT,
        telefone TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS boletos (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        cpf_cnpj TEXT,
        codigo_barras TEXT,
        valor REAL,
        valor_brl REAL,
        valor_usdt REAL,
        vencimento DATE,
        instituicao TEXT,
        status TEXT DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        numero_controle TEXT,
        comprovante_url TEXT,
        wallet_address TEXT,
        tx_hash TEXT
      )
    `);
    
    console.log('✅ Tabelas verificadas/criadas');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

// Handler principal para Vercel
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Inicializar banco na primeira execução
  await initDb();

  const { url, method } = req;
  const path = url.replace('/api', '');

  console.log(`🌐 ${method} ${path}`);

  try {
    // Rota raiz
    if (path === '/' && method === 'GET') {
      return res.json({
        message: 'Backend BXC funcionando no Vercel!',
        timestamp: new Date().toISOString(),
        database: 'Neon PostgreSQL'
      });
    }

    // Rotas de perfil
    if (path === '/perfil' && method === 'POST') {
      const { firebase_uid, nome, email, telefone } = req.body;
      console.log('📝 POST /perfil:', { firebase_uid, nome, email, telefone });
      
      await runQuery(
        `INSERT INTO users (firebase_uid, nome, email, telefone)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (firebase_uid) 
         DO UPDATE SET nome = $2, email = $3, telefone = $4`,
        [firebase_uid, nome, email, telefone]
      );
      
      return res.json({ message: 'Perfil atualizado com sucesso' });
    }

    if (path.startsWith('/perfil/') && method === 'GET') {
      const firebase_uid = path.replace('/perfil/', '');
      console.log('🔍 GET /perfil/:firebase_uid:', firebase_uid);
      
      const result = await getQuery('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
      return res.json(result || {});
    }

    // Rotas de boletos
    if (path === '/boletos' && method === 'GET') {
      const boletos = await allQuery('SELECT * FROM boletos ORDER BY criado_em DESC');
      return res.json(boletos);
    }

    if (path === '/boletos' && method === 'POST') {
      const { user_id, cpf_cnpj, codigo_barras, valor_brl, vencimento, instituicao } = req.body;
      
      const countResult = await getQuery('SELECT COUNT(*) as count FROM boletos');
      const numeroControle = (parseInt(countResult.count) + 1).toString().padStart(6, '0');
      
      const boleto = await getQuery(
        `INSERT INTO boletos (user_id, cpf_cnpj, codigo_barras, valor_brl, vencimento, instituicao, numero_controle)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [user_id, cpf_cnpj, codigo_barras, valor_brl, vencimento, instituicao, numeroControle]
      );
      
      return res.status(201).json(boleto);
    }

    if (path.startsWith('/boletos/usuario/') && method === 'GET') {
      const user_id = path.replace('/boletos/usuario/', '');
      const boletos = await allQuery('SELECT * FROM boletos WHERE user_id = $1 ORDER BY criado_em DESC', [user_id]);
      return res.json(boletos);
    }

    // Rota não encontrada
    return res.status(404).json({ error: 'Endpoint não encontrada' });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};
=======
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
>>>>>>> 754c65fa4087a81477508a22173adabb8c93e8d1
