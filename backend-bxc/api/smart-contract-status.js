/**
 * 🔗 VERCEL FUNCTION - Status do Smart Contract
 * 
 * Endpoint para verificar status de transações no smart contract
 * Rota: GET /api/smart-contract-status?boletoId={id}
 * 
 * @author Engenheiro Sênior
 * @version 1.0.1 - Produção (Corrigido para Vercel)
 */

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`🚀 API Smart Contract Status: ${req.method} ${req.url}`);

    // Importação dinâmica do serviço
    let SmartContractService;
    try {
      SmartContractService = require('../services/SmartContractService');
    } catch (error) {
      console.error('Erro ao carregar SmartContractService:', error);
      return res.status(500).json({
        error: 'Serviço não disponível',
        message: 'SmartContractService não pôde ser carregado',
        details: error.message
      });
    }

    // Inicializar serviço
    const smartContractService = new SmartContractService();

    if (req.method === 'GET') {
      const { boletoId } = req.query;

      if (boletoId) {
        // Verificar transação específica
        const transaction = await smartContractService.getTransactionByBoletoId(boletoId);
        const expirationCheck = await smartContractService.isTransactionExpired(boletoId);
        
        res.status(200).json({
          success: true,
          data: {
            boletoId: boletoId,
            transaction: transaction,
            expiration: expirationCheck
          },
          endpoint: '/api/smart-contract-status',
          timestamp: new Date().toISOString()
        });
      } else {
        // Obter estatísticas gerais do contrato
        const stats = await smartContractService.getContractStats();
        
        res.status(200).json({
          success: true,
          data: stats,
          endpoint: '/api/smart-contract-status',
          timestamp: new Date().toISOString()
        });
      }

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Smart Contract Status:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      endpoint: '/api/smart-contract-status',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
