/**
 * 🧪 API DE TESTE SIMPLES - Para verificar se o problema é de cache/deploy
 * Endpoint: POST /api/test-simple
 * 
 * Esta API faz APENAS:
 * 1. Conecta no banco
 * 2. Faz uma query simples SEM UUID
 * 3. Retorna resultado
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    console.log('🧪 TESTE SIMPLES - Iniciando...');
    
    const { numero_controle } = req.body;
    
    if (!numero_controle) {
      return res.status(400).json({ 
        error: 'numero_controle é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    // Converter para INTEGER
    const numeroControleInt = parseInt(numero_controle);
    if (isNaN(numeroControleInt)) {
      return res.status(400).json({ 
        error: 'numero_controle deve ser um número válido',
        received: numero_controle,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 Buscando boleto:', numeroControleInt);

    // Query SIMPLES - apenas INTEGER, SEM UUID
    const result = await pool.query(
      'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1 LIMIT 1',
      [numeroControleInt]
    );

    console.log('✅ Query executada com sucesso');
    console.log('📊 Resultados encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Boleto não encontrado',
        numero_controle: numeroControleInt,
        timestamp: new Date().toISOString()
      });
    }

    const boleto = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Teste simples executado com sucesso!',
      data: {
        numero_controle: boleto.numero_controle,
        status: boleto.status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ERRO NO TESTE SIMPLES:', error);
    console.error('📍 Stack:', error.stack);
    console.error('💬 Mensagem:', error.message);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};