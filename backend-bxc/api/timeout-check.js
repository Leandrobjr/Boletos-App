/**
 * ⏰ VERCEL FUNCTION - Verificação Automática de Timeout de Boletos
 *
 * Endpoint para verificação e processamento automático de boletos expirados
 * Rota: GET/POST /api/timeout-check
 *
 * @author Engenheiro Sênior
 * @version 1.0.0 - Produção
 */

const { Pool } = require('pg');

// Fallback seguro para conexão (evita localhost em produção)
const resolveDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
  if (envUrl && !isLocal) return envUrl;
  return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
};

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
    console.log('⏰ [TIMEOUT-CHECK] Iniciando verificação automática de timeout...');

    // 3. Conectar ao banco PostgreSQL (com fallback seguro)
    const pool = new Pool({
      connectionString: resolveDatabaseUrl(),
      ssl: { rejectUnauthorized: false }
    });

    // 4. Buscar boletos travados há mais de 60 minutos
    const agora = new Date();
    const limite60Minutos = new Date(agora.getTime() - (60 * 60 * 1000)); // 60 minutos atrás

    const boletosExpirados = await pool.query(`
      SELECT id, numero_controle, status, data_travamento, escrow_id, user_id
      FROM boletos 
      WHERE status IN ('PENDENTE_PAGAMENTO', 'AGUARDANDO_PAGAMENTO')
      AND data_travamento IS NOT NULL
      AND data_travamento <= $1
      ORDER BY data_travamento ASC
    `, [limite60Minutos.toISOString()]);

    console.log(`🔍 [TIMEOUT-CHECK] Encontrados ${boletosExpirados.rowCount} boletos expirados (60min)`);

    const resultados = {
      timestamp: agora.toISOString(),
      boletosExpirados60min: [],
      estatisticas: {
        totalExpirados60min: boletosExpirados.rowCount,
        processados: 0,
        erros: 0
      }
    };

    // 5. Processar boletos expirados (60 minutos)
    for (const boleto of boletosExpirados.rows) {
      try {
        const dataTravamento = new Date(boleto.data_travamento);
        const minutosDecorridos = (agora.getTime() - dataTravamento.getTime()) / (1000 * 60);

        console.log(`🔄 [TIMEOUT-CHECK] Processando boleto ${boleto.id} (${minutosDecorridos.toFixed(1)}min)`);

        // Destravar o boleto
        let updateResult;
        try {
          updateResult = await pool.query(`
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
        } catch (error) {
          if (String(error.code) === '42703') {
            // Fallback para esquemas antigos: atualiza somente status
            updateResult = await pool.query(`
              UPDATE boletos 
              SET status = 'DISPONIVEL'
              WHERE id = $1
              RETURNING id, status
            `, [boleto.id]);
          } else {
            throw error;
          }
        }

        if (updateResult.rowCount > 0) {
          resultados.boletosExpirados60min.push({
            id: boleto.id,
            numero_controle: boleto.numero_controle,
            minutosDecorridos: Math.round(minutosDecorridos),
            escrow_id: boleto.escrow_id,
            statusAnterior: boleto.status,
            novoStatus: 'DISPONIVEL',
            data_destravamento: agora.toISOString()
          });
          resultados.estatisticas.processados++;
          console.log(`✅ [TIMEOUT-CHECK] Boleto ${boleto.id} destravado com sucesso`);
        }
      } catch (error) {
        console.error(`❌ [TIMEOUT-CHECK] Erro ao processar boleto ${boleto.id}:`, error.message);
        resultados.estatisticas.erros++;
      }
    }

    // 6. (Removido) Não há expiração de 24h — fluxo segue apenas com destrave após 60min sem comprovante

    // 7. Log final
    console.log(`📊 [TIMEOUT-CHECK] Processamento concluído:`, {
      processados: resultados.estatisticas.processados,
      erros: resultados.estatisticas.erros,
      expirados60min: resultados.estatisticas.totalExpirados60min,
      muitoAntigos24h: 0
    });

    // 8. Resposta
    const statusCode = resultados.estatisticas.erros > 0 ? 207 : 200; // 207 = Multi-Status se houver erros
    
    return res.status(statusCode).json({
      success: true,
      message: 'Verificação de timeout concluída',
      ...resultados
    });

  } catch (error) {
    console.error('❌ [TIMEOUT-CHECK] Erro interno:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};


