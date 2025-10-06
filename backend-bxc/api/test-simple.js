/**
 * 🧪 ENDPOINT DE TESTE SIMPLES
 * 
 * Teste básico para verificar se o problema é com a estrutura do arquivo
 */

module.exports = async (req, res) => {
  // 1. CORS Headers (OBRIGATÓRIO)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 2. Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`🧪 Test Simple Request: ${req.method} ${req.url}`);
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request Headers:', req.headers);

    res.status(200).json({
      success: true,
      message: 'Endpoint de teste funcionando!',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de teste:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};
