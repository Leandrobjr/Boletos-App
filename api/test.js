/**
 * 🧪 VERCEL FUNCTION - Teste simples para verificar funcionamento
 * 
 * Endpoint: GET/POST /api/test
 * Lógica: Retorna informações básicas do ambiente
 */

module.exports = async (req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const response = {
    success: true,
    message: '✅ API funcionando corretamente!',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  res.status(200).json(response);
};