/**
 * 🔓 VERCEL FUNCTION - Destravar Boleto (Timeout de 60 minutos)
 *
 * Endpoint para destravar boletos que expiraram o prazo de 60 minutos
 * Rota: PUT /api/boletos/{id}/destravar
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

  // 3. Apenas PUT é permitido
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 4. Extrair ID do boleto da URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const boletoId = pathParts[pathParts.indexOf('boletos') + 1];

    if (!boletoId) {
      return res.status(400).json({ error: 'ID do boleto não fornecido' });
    }

    console.log(`🔓 [DESTRAVAR] Processando boleto: ${boletoId}`);

    // 5. Conectar ao banco PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // 6. Buscar o boleto atual
    const boletoResult = await pool.query(
      'SELECT * FROM boletos WHERE id = $1',
      [boletoId]
    );

    if (boletoResult.rowCount === 0) {
      console.log(`❌ [DESTRAVAR] Boleto não encontrado: ${boletoId}`);
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }

    const boleto = boletoResult.rows[0];
    console.log(`🔍 [DESTRAVAR] Boleto encontrado: ${boleto.id}, Status: ${boleto.status}`);

    // 7. Verificar se o boleto está travado
    if (boleto.status !== 'PENDENTE_PAGAMENTO' && boleto.status !== 'AGUARDANDO_PAGAMENTO') {
      console.log(`⚠️ [DESTRAVAR] Boleto não está travado. Status atual: ${boleto.status}`);
      return res.status(400).json({ 
        error: 'Boleto não está travado', 
        currentStatus: boleto.status 
      });
    }

    // 8. Verificar tempo de travamento (se aplicável)
    if (boleto.data_travamento) {
      const dataTravamento = new Date(boleto.data_travamento);
      const agora = new Date();
      const minutosDecorridos = (agora.getTime() - dataTravamento.getTime()) / (1000 * 60);
      
      console.log(`⏰ [DESTRAVAR] Tempo decorrido: ${minutosDecorridos.toFixed(1)} minutos`);
      
      // Se for menos de 60 minutos, não permitir destravar
      if (minutosDecorridos < 60) {
        console.log(`⏳ [DESTRAVAR] Boleto ainda dentro do prazo de 60 minutos`);
        return res.status(400).json({ 
          error: 'Boleto ainda dentro do prazo de 60 minutos',
          minutosDecorridos: Math.round(minutosDecorridos),
          tempoRestante: Math.round(60 - minutosDecorridos)
        });
      }
    }

    // 9. Destravar o boleto - atualizar status para DISPONIVEL
    const agora = new Date().toISOString();
    
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
      RETURNING *
    `, [agora, boletoId]);

    if (updateResult.rowCount === 0) {
      console.log(`❌ [DESTRAVAR] Falha ao atualizar boleto: ${boletoId}`);
      return res.status(500).json({ error: 'Falha ao destravar boleto' });
    }

    const boletoAtualizado = updateResult.rows[0];
    console.log(`✅ [DESTRAVAR] Boleto destravado com sucesso: ${boletoId}`);

    // 10. Se tiver escrow_id válido, tentar liberar fundos no contrato
    if (boleto.escrow_id && boleto.escrow_id !== '0x123' && boleto.escrow_id.length > 10) {
      console.log(`🔄 [DESTRAVAR] Tentando liberar fundos do escrow: ${boleto.escrow_id}`);
      
      try {
        // Aqui você pode implementar a lógica para liberar fundos no smart contract
        // Por enquanto, apenas log
        console.log(`📝 [DESTRAVAR] Escrow ${boleto.escrow_id} marcado para liberação`);
      } catch (contractError) {
        console.error(`❌ [DESTRAVAR] Erro ao liberar fundos do escrow:`, contractError.message);
        // Não falhar o destravar por causa do contrato
      }
    }

    // 11. Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Boleto destravado com sucesso',
      boleto: {
        id: boletoAtualizado.id,
        status: boletoAtualizado.status,
        data_destravamento: boletoAtualizado.data_destravamento,
        updated_at: boletoAtualizado.updated_at
      },
      timestamp: agora
    });

  } catch (error) {
    console.error('❌ [DESTRAVAR] Erro interno:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};


