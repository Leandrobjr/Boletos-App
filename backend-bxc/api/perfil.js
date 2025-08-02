// API Route para Vercel - Perfil de usuário
import { Pool } from 'pg';

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // Headers CORS FORÇADOS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔧 CORS Preflight request');
    return res.status(200).end();
  }

  console.log(`🚀 API Perfil Request: ${req.method} ${req.url}`);

  try {
    if (req.method === 'GET') {
      // GET /api/perfil?uid=xxx
      const { uid } = req.query;
      
      if (!uid) {
        return res.status(400).json({
          error: 'UID é obrigatório',
          message: 'Parâmetro uid não fornecido'
        });
      }

      console.log('📍 GET perfil para UID:', uid);
      
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE firebase_uid = $1',
        [uid]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          uid: uid
        });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'POST') {
      console.log('📍 POST perfil:', req.body);
      
      const { firebase_uid, nome, email, cpf, telefone, endereco } = req.body;
      
      if (!firebase_uid) {
        return res.status(400).json({
          error: 'firebase_uid é obrigatório'
        });
      }
      
      const result = await pool.query(`
        INSERT INTO usuarios (firebase_uid, nome, email, cpf, telefone, endereco, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (firebase_uid) 
        DO UPDATE SET 
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          cpf = EXCLUDED.cpf,
          telefone = EXCLUDED.telefone,
          endereco = EXCLUDED.endereco,
          updated_at = NOW()
        RETURNING *
      `, [firebase_uid, nome, email, cpf, telefone, endereco]);
      
      return res.status(200).json(result.rows[0]);
    }

    // Método não permitido
    return res.status(405).json({
      error: 'Método não permitido',
      method: req.method,
      allowed: ['GET', 'POST', 'OPTIONS']
    });

  } catch (error) {
    console.error('❌ Erro na API Perfil:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}