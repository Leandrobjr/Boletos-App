/**
 * 🔍 VERCEL FUNCTION - Verificação de Timeout de Boletos
 * 
 * Endpoint para verificação manual e estatísticas de timeout
 * Rota: GET/POST /api/timeout-check
 * 
 * @author Engenheiro Sênior
 * @version 1.0.1 - Produção (Corrigido para Vercel)
 */

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`🚀 API Timeout Check: ${req.method} ${req.url}`);

    // Importação dinâmica do serviço
    let AutoTimeoutService;
    try {
      AutoTimeoutService = require('../services/AutoTimeoutService');
    } catch (error) {
      console.error('Erro ao carregar AutoTimeoutService:', error);
      return res.status(500).json({
        error: 'Serviço não disponível',
        message: 'AutoTimeoutService não pôde ser carregado',
        details: error.message
      });
    }

    // Inicializar serviço
    const autoTimeoutService = new AutoTimeoutService();

    if (req.method === 'GET') {
      // 📊 Obter estatísticas
      const stats = await autoTimeoutService.getStats();
      
      if (!stats) {
        return res.status(500).json({
          error: 'Erro ao obter estatísticas',
          message: 'Falha na consulta ao banco de dados'
        });
      }

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Estatísticas de timeout obtidas com sucesso',
        endpoint: '/api/timeout-check',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'POST') {
      // 🔍 Executar verificação manual
      console.log('🔍 Executando verificação manual de timeout...');
      
      await autoTimeoutService.performCheck();
      
      // Obter estatísticas após verificação
      const stats = await autoTimeoutService.getStats();

      res.status(200).json({
        success: true,
        data: {
          message: 'Verificação de timeout executada com sucesso',
          stats: stats
        },
        endpoint: '/api/timeout-check',
        timestamp: new Date().toISOString()
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'POST', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Timeout Check:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      endpoint: '/api/timeout-check',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
