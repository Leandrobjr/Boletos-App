const { Pool } = require('pg');

// Configuração do banco usando variáveis separadas
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

const pool = new Pool({
  connectionString: `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // ID está antes da action
    const action = pathParts[pathParts.length - 1]; // Action é o último elemento

    console.log(`🚀 API Boletos [ID] Request: ${req.method} ${req.url}, ID: ${id}, Action: ${action}`);

    if (!id || id === 'boletos') {
      return res.status(400).json({
        error: 'ID é obrigatório',
        message: 'Parâmetro id não fornecido na URL'
      });
    }

    if (req.method === 'PATCH' && action === 'cancelar') {
      // Cancelar boleto
      const result = await pool.query(
        'UPDATE boletos SET status = $1 WHERE id = $2 RETURNING *',
        ['EXCLUIDO', id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto cancelado com sucesso'
      });

    } else if (req.method === 'PATCH' && action === 'baixar') {
      // Baixar boleto
      const result = await pool.query(
        'UPDATE boletos SET status = $1 WHERE id = $2 RETURNING *',
        ['BAIXADO', id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto baixado com sucesso'
      });

    } else if (req.method === 'PATCH' && action === 'reservar') {
      // Reservar boleto
      console.log('🔒 Iniciando reserva de boleto:', { id, action });
      console.log('📦 Body recebido:', req.body);
      
      const { user_id, wallet_address, tx_hash } = req.body;
      
      console.log('🔍 Dados extraídos:', { user_id, wallet_address, tx_hash });
      
      if (!user_id || !wallet_address) {
        console.log('❌ Dados obrigatórios faltando:', { user_id: !!user_id, wallet_address: !!wallet_address });
        return res.status(400).json({
          error: 'Dados obrigatórios',
          message: 'user_id e wallet_address são obrigatórios'
        });
      }

      try {
        console.log('🔍 Verificando boleto no banco...');
        // Aceita tanto UUID (coluna id) quanto numero_controle (string)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const checkResult = await pool.query(
          isUUID ? 'SELECT * FROM boletos WHERE id = $1' : 'SELECT * FROM boletos WHERE numero_controle = $1',
          [id]
        );
        
        console.log('📊 Boleto encontrado:', checkResult.rows[0]);
        
        if (checkResult.rowCount === 0) {
          console.log('❌ Boleto não encontrado:', id);
          return res.status(404).json({
            error: 'Boleto não encontrado',
            id: id
          });
        }

        const boleto = checkResult.rows[0];
        console.log('📋 Status atual do boleto:', boleto.status);
        
        if (boleto.status !== 'DISPONIVEL') {
          console.log('❌ Boleto não está disponível:', boleto.status);
          return res.status(400).json({
            error: 'Boleto não disponível',
            message: `Boleto está com status: ${boleto.status}`,
            id: id
          });
        }

        console.log('✅ Boleto válido, executando UPDATE...');
        const result = await pool.query(
          isUUID
            ? 'UPDATE boletos SET status = $1, wallet_address = $2, tx_hash = $3 WHERE id = $4 AND status = $5 RETURNING *'
            : 'UPDATE boletos SET status = $1, wallet_address = $2, tx_hash = $3 WHERE numero_controle = $4 AND status = $5 RETURNING *',
          ['AGUARDANDO PAGAMENTO', wallet_address, tx_hash, id, 'DISPONIVEL']
        );

        console.log('📊 Resultado do UPDATE:', result.rowCount, 'linhas afetadas');

        if (result.rowCount === 0) {
          console.log('❌ Nenhuma linha foi atualizada');
          return res.status(404).json({
            error: 'Boleto não encontrado ou não disponível',
            id: id
          });
        }

        console.log('✅ Boleto reservado com sucesso:', result.rows[0]);
        res.status(200).json({
          success: true,
          data: result.rows[0],
          message: 'Boleto reservado com sucesso'
        });
      } catch (dbError) {
        console.error('❌ Erro no banco de dados durante reserva:', dbError);
        res.status(500).json({
          error: 'Erro interno do servidor',
          details: dbError.message,
          stack: dbError.stack
        });
      }

    } else if (req.method === 'PATCH' && action === 'atualizar') {
      // Atualizar boleto
      const { vencimento } = req.body;
      
      if (!vencimento) {
        return res.status(400).json({
          error: 'Data de vencimento é obrigatória',
          message: 'vencimento é obrigatório'
        });
      }

      const result = await pool.query(
        'UPDATE boletos SET vencimento = $1 WHERE id = $2 RETURNING *',
        [vencimento, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto atualizado com sucesso'
      });

    } else if (req.method === 'DELETE') {
      // Excluir boleto
      const result = await pool.query(
        'DELETE FROM boletos WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto excluído com sucesso'
      });

    } else if (req.method === 'GET') {
      // Buscar boleto específico
      const result = await pool.query(
        'SELECT * FROM boletos WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Boleto não encontrado',
          id: id
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'PATCH', 'DELETE', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos [ID]:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}; 