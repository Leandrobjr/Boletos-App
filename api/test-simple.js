// Teste SIMPLES de conexão - Sem banco de dados
module.exports = async (req, res) => {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Teste 1: Verificar se a function está sendo executada
    console.log('🚀 Function executando...');
    
    // Teste 2: Verificar variáveis de ambiente
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      DB_USER: process.env.DB_USER ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      DB_PASS: process.env.DB_PASS ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      DB_NAME: process.env.DB_NAME ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURADO' : 'NÃO CONFIGURADO'
    };
    
    console.log('🔍 Variáveis de ambiente:', envVars);
    
    // Teste 3: Verificar se pg está disponível
    let pgAvailable = false;
    try {
      const { Pool } = require('pg');
      pgAvailable = true;
      console.log('✅ pg module disponível');
    } catch (pgError) {
      console.error('❌ pg module não disponível:', pgError.message);
    }
    
    res.json({
      message: 'Teste simples funcionando!',
      timestamp: new Date().toISOString(),
      environment: envVars,
      pg_available: pgAvailable,
      function_running: true
    });
    
  } catch (error) {
    console.error('❌ Erro no teste simples:', error);
    res.status(500).json({
      error: 'Erro no teste simples',
      details: error.message,
      stack: error.stack
    });
  }
}; 