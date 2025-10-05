/**
 * 🔗 VERCEL FUNCTION - Status do Smart Contract
 * 
 * Endpoint para verificar status de transações no smart contract
 * Rota: GET /api/smart-contract/status?boletoId={id}
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0 - Produção
 */

const SmartContractService = require('../../services/SmartContractService');

// Instância global do serviço
let smartContractService = null;

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

    // Inicializar serviço se necessário
    if (!smartContractService) {
      smartContractService = new SmartContractService();
    }

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
          }
        });
      } else {
        // Obter estatísticas gerais do contrato
        const stats = await smartContractService.getContractStats();
        
        res.status(200).json({
          success: true,
          data: stats
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
