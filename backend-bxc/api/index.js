// Vercel Function para todas as rotas API
const { Pool } = require('pg');
const { ethers } = require('ethers');

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
  
  console.log(`🚀 API Request: ${method} ${url}`);
  console.log('📍 Query:', req.query);
  console.log('📍 Body:', req.body);

  try {
    // POST /api/fees/collect - coleta taxas acumuladas do contrato P2P para o owner
    if (method === 'POST' && url === '/api/fees/collect') {
      try {
        const rpcUrl = process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';
        const escrow = process.env.P2P_ESCROW_ADDRESS || '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2';
        const pk = process.env.OWNER_PRIVATE_KEY; // Mantenha no .env de Vercel/ambiente seguro
        if (!pk) {
          return res.status(400).json({ error: 'OWNER_PRIVATE_KEY não configurada' });
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(pk, provider);

        const abi = [
          'function owner() view returns (address)',
          'function usdt() view returns (address)',
          'function emergencyWithdraw(address _token)'
        ];

        const contract = new ethers.Contract(escrow, abi, wallet);
        const owner = await contract.owner();
        if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
          return res.status(403).json({ error: 'Carteira não é o owner do contrato', owner, signer: wallet.address });
        }

        const usdt = await contract.usdt();
        const tx = await contract.emergencyWithdraw(usdt);
        const receipt = await tx.wait();

        return res.json({ success: true, txHash: tx.hash, status: receipt.status });
      } catch (e) {
        console.error('Erro ao coletar taxas:', e);
        return res.status(500).json({ error: 'Falha na coleta de taxas', details: e.message });
      }
    }
    // Rota raiz - responder a qualquer URL que comece com /api
    if (url === '/api' || url === '/' || url.startsWith('/api/')) {
      // Se for apenas /api, retornar status
      if (url === '/api' || url === '/') {
        return res.json({ 
          message: 'Backend Vercel Function funcionando',
          timestamp: new Date().toISOString(),
          method,
          url
        });
      }
    }

    // GET /api/perfil/:uid
    if (method === 'GET' && url.startsWith('/api/perfil/')) {
      const uid = url.split('/api/perfil/')[1];
      console.log('📍 GET perfil para UID:', uid);
      
      const result = await pool.query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [uid]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          uid: uid
        });
      }
      
      return res.json(result.rows[0]);
    }

    // POST /api/perfil
    if (method === 'POST' && url === '/api/perfil') {
      console.log('📍 POST perfil:', req.body);
      
      const { firebase_uid, nome, email, cpf, telefone, endereco } = req.body;
      
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
      
      return res.json(result.rows[0]);
    }

    // Fallback 404
    return res.status(404).json({
      error: 'Rota não encontrada',
      method,
      url,
      available_routes: [
        'GET /api',
        'GET /api/perfil/:uid',
        'POST /api/perfil'
      ]
    });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};