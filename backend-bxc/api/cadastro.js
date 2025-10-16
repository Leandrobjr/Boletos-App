// Vercel Function para cadastro de usuários
const { Pool } = require('pg');
const admin = require('firebase-admin');

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

// Inicializar Firebase Admin se não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "projeto-bxc",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

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
  
  console.log(`🚀 API Cadastro Request: ${method} ${url}`);
  console.log('📍 Query:', req.query);
  console.log('📍 Body:', req.body);

  try {
    // POST /api/cadastro
    if (method === 'POST') {
      console.log('📍 POST cadastro:', req.body);
      
      const { nome, email, telefone, senha } = req.body;
      
      // Validações
      if (!nome || !email || !telefone || !senha) {
        return res.status(400).json({
          error: 'Todos os campos são obrigatórios',
          required: ['nome', 'email', 'telefone', 'senha']
        });
      }

      if (senha.length < 8) {
        return res.status(400).json({
          error: 'A senha deve ter pelo menos 8 caracteres'
        });
      }

      if (!email.includes('@')) {
        return res.status(400).json({
          error: 'E-mail inválido'
        });
      }

      // Verificar se o email já existe
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'E-mail já cadastrado'
        });
      }

      try {
        // Criar usuário no Firebase Auth
        const userRecord = await admin.auth().createUser({
          email: email,
          password: senha,
          displayName: nome,
          phoneNumber: telefone
        });

        console.log('✅ Usuário criado no Firebase:', userRecord.uid);

        // Salvar no banco de dados
        const result = await pool.query(`
          INSERT INTO users (firebase_uid, nome, email, telefone)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [userRecord.uid, nome, email, telefone]);

        console.log('✅ Usuário salvo no banco:', result.rows[0]);

        return res.status(201).json({
          success: true,
          message: 'Usuário cadastrado com sucesso',
          user: {
            uid: userRecord.uid,
            nome: nome,
            email: email,
            telefone: telefone
          }
        });

      } catch (firebaseError) {
        console.error('❌ Erro no Firebase:', firebaseError);

        // Se o erro for de email já existente no Firebase
        if (firebaseError.code === 'auth/email-already-exists') {
          return res.status(409).json({
            error: 'E-mail já cadastrado'
          });
        }

        // Se o erro for de senha fraca
        if (firebaseError.code === 'auth/weak-password') {
          return res.status(400).json({
            error: 'Senha muito fraca. Use pelo menos 8 caracteres'
          });
        }

        // Se o erro for de email inválido
        if (firebaseError.code === 'auth/invalid-email') {
          return res.status(400).json({
            error: 'E-mail inválido'
          });
        }

        return res.status(500).json({
          error: 'Erro ao criar usuário',
          details: firebaseError.message
        });
      }
    }

    // Method not allowed
    return res.status(405).json({
      error: 'Método não permitido',
      allowed: ['POST'],
      method: method
    });

  } catch (error) {
    console.error('❌ Erro na API Cadastro:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
