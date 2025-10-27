// Endpoint de teste para verificar se o deploy foi aplicado
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const deployInfo = {
      timestamp: new Date().toISOString(),
      version: 'v2.1-fix-uuid-text',
      commit: 'dd8f1cf8',
      message: 'Deploy test - conversões id::text removidas',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
      },
      fixes_applied: [
        'Removidas conversões (id::text = $1) das queries SELECT',
        'Removidas conversões (id::text = $1) das queries UPDATE', 
        'Lógica UUID separada da lógica numérica',
        'Pool PostgreSQL apenas em produção'
      ]
    };

    console.log('🔍 [TEST-DEPLOY] Informações do deploy:', deployInfo);

    return res.status(200).json({
      success: true,
      deploy: deployInfo
    });

  } catch (error) {
    console.error('❌ [TEST-DEPLOY] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro no teste de deploy',
      details: error.message 
    });
  }
};