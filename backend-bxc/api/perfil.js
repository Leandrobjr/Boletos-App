// Vercel Function para perfil - Base
const { Pool } = require('pg');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
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
  
  console.log(`🚀 API Perfil Request: ${method} ${url}`);
  console.log('📍 Query:', req.query);
  console.log('📍 Body:', req.body);

  try {
    // GET /api/perfil?uid=ABC123
    if (method === 'GET') {
      const uid = req.query.uid;
      console.log('📍 GET perfil para UID:', uid);
      
      if (!uid) {
        return res.status(400).json({
          error: 'UID é obrigatório',
          example: '/api/perfil?uid=ABC123'
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

    // POST /api/perfil
    if (method === 'POST') {
      console.log('📍 POST perfil:', req.body);
      
      const { firebase_uid, nome, email, telefone } = req.body;
      
      if (!firebase_uid) {
        return res.status(400).json({
          error: 'firebase_uid é obrigatório'
        });
      }
      
      const result = await pool.query(`
        INSERT INTO users (firebase_uid, nome, email, telefone)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (firebase_uid) 
        DO UPDATE SET 
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          telefone = EXCLUDED.telefone
        RETURNING *
      `, [firebase_uid, nome, email, telefone]);
      
      console.log('✅ Perfil atualizado:', result.rows[0]);
      return res.status(200).json(result.rows[0]);
    }

    // Method not allowed
    return res.status(405).json({
      error: 'Método não permitido',
      allowed: ['GET', 'POST'],
      method: method
    });

  } catch (error) {
    console.error('❌ Erro na API Perfil:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};