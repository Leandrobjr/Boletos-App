const SmartContractService = require('../services/SmartContractService');

// CORS util
const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
};

module.exports = async (req, res) => {
  setCors(res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Método não permitido',
      method: req.method,
      allowed: ['GET', 'OPTIONS']
    });
  }

  try {
    const service = new SmartContractService();
    const initialized = await service.initialize();

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const boletoIdParam = url.searchParams.get('boletoId');

    const stats = await service.getContractStats();

    let transaction = null;
    let expiration = null;
    if (boletoIdParam) {
      const boletoId = Number(boletoIdParam);
      transaction = await service.getTransactionByBoletoId(boletoId);
      expiration = await service.isTransactionExpired(boletoId);
    }

    return res.status(200).json({
      success: true,
      initialized,
      service: stats,
      ...(boletoIdParam ? { boletoId: Number(boletoIdParam), transaction, expiration } : {})
    });
  } catch (error) {
    console.error('❌ [SMART_CONTRACT/STATUS] Erro ao obter status:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};