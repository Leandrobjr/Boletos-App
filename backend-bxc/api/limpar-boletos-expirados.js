/**
 * 🧹 VERCEL FUNCTION - Limpar Boletos Expirados (EMERGÊNCIA)
 *
 * Endpoint para limpar boletos expirados manualmente
 * Rota: POST /api/limpar-boletos-expirados
 *
 * @author Engenheiro Sênior
 * @version 1.0.0 - Produção
 */

const { Pool } = require('pg');

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
    console.log('🧹 [LIMPAR] Iniciando limpeza de boletos expirados...');

    // 3. Conectar ao banco PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // 4. Buscar boletos travados há mais de 60 minutos
    const agora = new Date();
    const limite60Minutos = new Date(agora.getTime() - (60 * 60 * 1000));

    const boletosExpirados = await pool.query(`
      SELECT id, numero_controle, status, data_travamento, user_id
      FROM boletos 
      WHERE status IN ('PENDENTE_PAGAMENTO', 'AGUARDANDO_PAGAMENTO')
      AND data_travamento IS NOT NULL
      AND data_travamento <= $1
      ORDER BY data_travamento ASC
    `, [limite60Minutos.toISOString()]);

    console.log(`🔍 [LIMPAR] Encontrados ${boletosExpirados.rowCount} boletos expirados`);

    const resultados = {
      timestamp: agora.toISOString(),
      boletosLimpos: [],
      estatisticas: {
        total: boletosExpirados.rowCount,
        processados: 0,
        erros: 0
      }
    };

    // 5. Limpar cada boleto expirado
    for (const boleto of boletosExpirados.rows) {
      try {
        const dataTravamento = new Date(boleto.data_travamento);
        const minutosDecorridos = (agora.getTime() - dataTravamento.getTime()) / (1000 * 60);

        console.log(`🔄 [LIMPAR] Limpando boleto ${boleto.id} (${minutosDecorridos.toFixed(1)}min)`);

        // Atualizar status para DISPONIVEL
        const updateResult = await pool.query(`
          UPDATE boletos 
          SET 
            status = 'DISPONIVEL',
            comprador_id = NULL,
            wallet_address = NULL,
            data_destravamento = $1,
            data_travamento = NULL,
            updated_at = $1
          WHERE id = $2
          RETURNING id, status, data_destravamento
        `, [agora.toISOString(), boleto.id]);

        if (updateResult.rowCount > 0) {
          resultados.boletosLimpos.push({
            id: boleto.id,
            numero_controle: boleto.numero_controle,
            minutosDecorridos: Math.round(minutosDecorridos),
            statusAnterior: boleto.status,
            novoStatus: 'DISPONIVEL'
          });
          resultados.estatisticas.processados++;
          console.log(`✅ [LIMPAR] Boleto ${boleto.id} limpo com sucesso`);
        }
      } catch (error) {
        console.error(`❌ [LIMPAR] Erro ao limpar boleto ${boleto.id}:`, error.message);
        resultados.estatisticas.erros++;
      }
    }

    // 6. Resposta
    return res.status(200).json({
      success: true,
      message: 'Limpeza de boletos expirados concluída',
      ...resultados
    });

  } catch (error) {
    console.error('❌ [LIMPAR] Erro interno:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
