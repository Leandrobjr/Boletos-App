// Vercel Function para perfil dinâmico - [uid].js
const { Pool } = require('pg');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

// Verificar se as variáveis de ambiente estão configuradas
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

console.log('🔍 DB_HOST:', dbHost);
console.log('🔍 DB_USER:', dbUser);
console.log('🔍 DB_PASS configurado:', dbPass ? 'SIM' : 'NÃO');
console.log('🔍 DB_NAME:', dbName);

// Configuração do banco
const pool = new Pool({
  connectionString: `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Adicionar headers CORS
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;
  
  console.log(`🚀 API Perfil Dinâmico Request: ${method} ${url}`);
  console.log('📍 Query:', req.query);
  console.log('📍 Body:', req.body);

  try {
    // GET /api/perfil/[uid]?uid=ABC123
    if (method === 'GET') {
      const uid = req.query.uid;
      console.log('📍 GET perfil dinâmico para UID:', uid);
      
      if (!uid) {
        return res.status(400).json({
          error: 'UID é obrigatório',
          example: '/api/perfil/[uid]?uid=ABC123'
        });
      }
      
      const result = await pool.query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [uid]
      );
      
      if (result.rows.length === 0) {
        console.log('❌ Usuário não encontrado para UID:', uid);
        return res.status(404).json({
          error: 'Usuário não encontrado',
          uid: uid
        });
      }
      
      console.log('✅ Perfil encontrado:', result.rows[0]);
      return res.status(200).json(result.rows[0]);
    }

    // Method not allowed
    return res.status(405).json({
      error: 'Método não permitido',
      allowed: ['GET'],
      method: method
    });

  } catch (error) {
    console.error('❌ Erro na API Perfil Dinâmico:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};