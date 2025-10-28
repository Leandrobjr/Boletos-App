/**
 * 📤 VERCEL SERVERLESS FUNCTION - Upload de comprovantes
 * Endpoint: POST /api/upload-comprovante
 */

const { put } = require('@vercel/blob');
const { Pool } = require('pg');

// Configuração do banco PostgreSQL para produção
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🚀 Iniciando upload-comprovante...');
    console.log('📝 Body recebido:', req.body);
    console.log('🔗 DATABASE_URL existe:', !!process.env.DATABASE_URL);
    
    const { boleto_id, file_data, filename, filetype } = req.body;

    if (!boleto_id || !file_data || !filename) {
      return res.status(400).json({ 
        error: 'Dados obrigatórios: boleto_id, file_data, filename' 
      });
    }

    // Verificar se o boleto existe
    const isNumeric = /^\d+$/.test(boleto_id);
    let boletoQuery;
    
    if (isNumeric) {
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE id = $1',
        [parseInt(boleto_id)]
      );
    } else {
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1',
        [boleto_id]
      );
    }

    if (boletoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }

    const boleto = boletoQuery.rows[0];

    // Converter base64 para Buffer
    let fileBuffer;
    if (file_data.startsWith('data:')) {
      const base64Data = file_data.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      fileBuffer = Buffer.from(file_data, 'base64');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobFilename = `comprovantes/${boleto.numero_controle}/${timestamp}_${sanitizedFilename}`;

    // Upload para Vercel Blob
    const blob = await put(blobFilename, fileBuffer, {
      access: 'public',
      contentType: filetype || 'application/octet-stream'
    });

    // Atualizar boleto no banco
    let updateQuery, updateParams;
    
    if (isNumeric) {
      updateQuery = `
        UPDATE boletos 
        SET 
          comprovante_url = $1,
          comprovante_filename = $2,
          comprovante_filetype = $3,
          status = CASE 
            WHEN status = 'TRAVADO' THEN 'AGUARDANDO_BAIXA'
            ELSE status 
          END,
          upload_em = NOW()
        WHERE id = $4
        RETURNING *
      `;
      updateParams = [blob.url, filename, filetype || 'application/octet-stream', parseInt(boleto_id)];
    } else {
      updateQuery = `
        UPDATE boletos 
        SET 
          comprovante_url = $1,
          comprovante_filename = $2,
          comprovante_filetype = $3,
          status = CASE 
            WHEN status = 'TRAVADO' THEN 'AGUARDANDO_BAIXA'
            ELSE status 
          END,
          upload_em = NOW()
        WHERE numero_controle = $4
        RETURNING *
      `;
      updateParams = [blob.url, filename, filetype || 'application/octet-stream', boleto_id];
    }

    const updateResult = await pool.query(updateQuery, updateParams);

    if (updateResult.rows.length === 0) {
      return res.status(500).json({ error: 'Falha ao atualizar boleto' });
    }

    const boletoAtualizado = updateResult.rows[0];

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Comprovante enviado com sucesso',
      data: {
        comprovante_url: blob.url,
        filename: filename,
        boleto_id: boleto_id,
        status: boletoAtualizado.status,
        upload_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro detalhado no upload:', error);
    console.error('📍 Stack trace:', error.stack);
    console.error('🔍 Tipo do erro:', error.name);
    console.error('💬 Mensagem:', error.message);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
      details: error.message
    });
  }
};