/**
 * 🤖 VERCEL FUNCTION - Baixa automática após 72h
 *
 * Endpoint: GET/POST /api/auto-release-72h
 * Lógica:
 * - Seleciona boletos com status 'AGUARDANDO BAIXA'/'AGUARDANDO_BAIXA' e escrow_id definido
 * - Consulta transação on-chain (proofUploadedAt, fundsReleased)
 * - Se já passaram 72h do comprovante, chama autoRelease no contrato
 * - Atualiza status para 'BAIXADO_AUTOMATICO' no banco ao sucesso
 */

const { Pool } = require('pg');
const SmartContractService = require('../services/SmartContractService');

// Fallback seguro para conexão (evita localhost em produção)
const resolveDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
  if (envUrl && !isLocal) return envUrl;
  return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
};

module.exports = async (req, res) => {
  // 1) CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const nowIso = new Date().toISOString();
  const results = {
    timestamp: nowIso,
    encontrados: 0,
    elegiveis: 0,
    liberados: 0,
    pendentes: 0,
    erros: 0,
    detalhes: [],
    faltandoChavePrivada: false
  };

  try {
    console.log('🤖 [AUTO-RELEASE-72H] Iniciando verificação de baixa automática...');
    const pool = new Pool({ connectionString: resolveDatabaseUrl(), ssl: { rejectUnauthorized: false } });
    const smart = new SmartContractService();
    await smart.initialize();

    // 2) Seleciona boletos em AGUARDANDO BAIXA
    const query = `
      SELECT id, numero_controle, status, escrow_id, user_id
      FROM boletos
      WHERE status IN ('AGUARDANDO BAIXA', 'AGUARDANDO_BAIXA')
        AND escrow_id IS NOT NULL
      ORDER BY id ASC
    `;
    const { rows } = await pool.query(query);
    results.encontrados = rows.length;
    console.log(`🔍 [AUTO-RELEASE-72H] Encontrados ${rows.length} boletos com comprovante aguardando baixa`);

    const pkMissing = !(process.env.AUTORELEASE_PRIVATE_KEY || process.env.OWNER_PRIVATE_KEY);
    if (pkMissing) {
      console.warn('⚠️ [AUTO-RELEASE-72H] Chave privada não configurada. Apenas relatório, sem execução on-chain.');
      results.faltandoChavePrivada = true;
    }

    for (const boleto of rows) {
      try {
        const txn = await smart.getTransactionByEscrowId(boleto.escrow_id);
        if (!txn) {
          results.pendentes++;
          results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, motivo: 'Transação não encontrada on-chain' });
          continue;
        }

        // Elegibilidade local: 72h após proofUploadedAt e não liberado
        const elig = smart.isEligibleForAutoReleaseLocal(txn);
        if (!elig.eligible) {
          results.pendentes++;
          results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, motivo: elig.reason || 'Ainda dentro do prazo' });
          continue;
        }

        results.elegiveis++;

        if (pkMissing) {
          // Sem chave privada: apenas relatar elegível
          results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, elegivel: true, escrow_id: boleto.escrow_id });
          continue;
        }

        // 3) Executa autoRelease
        const release = await smart.autoReleaseTransaction(boleto.escrow_id);
        if (!release.success) {
          results.erros++;
          results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, erro: release.reason || 'Falha no autoRelease' });
          continue;
        }

        // 4) Atualiza status no banco: BAIXADO_AUTOMATICO
        try {
          const update = await pool.query(
            `UPDATE boletos SET status = 'BAIXADO_AUTOMATICO', tx_hash = $1 WHERE id = $2 RETURNING id, status`,
            [release.txHash, boleto.id]
          );

          if (update.rowCount === 0) {
            results.erros++;
            results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, erro: 'Update no banco não afetou nenhuma linha' });
            continue;
          }

          results.liberados++;
          results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, tx_hash: release.txHash, novoStatus: 'BAIXADO_AUTOMATICO' });
        } catch (dbErr) {
          // Fallback: coluna tx_hash ausente
          const code = dbErr?.code || '';
          if (code === '42703') {
            console.warn(`⚠️ [AUTO-RELEASE-72H] tx_hash ausente. Atualizando apenas status para boleto ${boleto.id}`);
            const updateFallback = await pool.query(
              `UPDATE boletos SET status = 'BAIXADO_AUTOMATICO' WHERE id = $1 RETURNING id, status`,
              [boleto.id]
            );
            if (updateFallback.rowCount > 0) {
              results.liberados++;
              results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, tx_hash: null, novoStatus: 'BAIXADO_AUTOMATICO' });
            } else {
              results.erros++;
              results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, erro: 'Fallback de update falhou' });
            }
          } else {
            results.erros++;
            results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, erro: dbErr.message });
          }
        }
      } catch (error) {
        console.error(`❌ [AUTO-RELEASE-72H] Erro ao processar boleto ${boleto.id}:`, error);
        results.erros++;
        results.detalhes.push({ id: boleto.id, numero_controle: boleto.numero_controle, erro: error.message });
      }
    }

    const statusCode = results.erros > 0 ? 207 : 200;
    console.log('📊 [AUTO-RELEASE-72H] Resumo:', {
      encontrados: results.encontrados,
      elegiveis: results.elegiveis,
      liberados: results.liberados,
      pendentes: results.pendentes,
      faltandoChavePrivada: results.faltandoChavePrivada
    });

    return res.status(statusCode).json({ success: true, ...results });
  } catch (error) {
    console.error('❌ [AUTO-RELEASE-72H] Erro interno:', error);
    return res.status(500).json({ success: false, error: error.message, timestamp: nowIso });
  }
};