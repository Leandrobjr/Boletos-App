/**
 * 📤 VERCEL SERVERLESS FUNCTION - Upload de comprovantes (VERSÃO CORRIGIDA)
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
    console.log('🚀 Iniciando upload-comprovante (VERSÃO CORRIGIDA)...');
    
    const { boleto_id, file_data, filename, filetype } = req.body;

    if (!boleto_id || !file_data || !filename) {
      return res.status(400).json({ 
        error: 'Dados obrigatórios: boleto_id, file_data, filename'
      });
    }

    // Verificar se o boleto existe - CORREÇÃO: usar CAST para compatibilidade
    console.log('🔍 Buscando boleto por numero_controle:', boleto_id);
    
    if (!boleto_id) {
      return res.status(400).json({ 
        error: 'boleto_id é obrigatório',
        received: boleto_id
      });
    }

    // CORREÇÃO: Usar CAST para evitar erro de tipo UUID vs TEXT
    const boletoQuery = await pool.query(
      'SELECT id, numero_controle, status FROM boletos WHERE CAST(numero_controle AS TEXT) = $1',
      [String(boleto_id)]
    );

    if (boletoQuery.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Boleto não encontrado', 
        numero_controle: boleto_id 
      });
    }

    const boleto = boletoQuery.rows[0];
    console.log('✅ Boleto encontrado:', boleto.numero_controle);

    // Processar arquivo
    let fileBuffer;
    try {
      if (file_data.startsWith('data:')) {
        const base64Data = file_data.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        fileBuffer = Buffer.from(file_data, 'base64');
      }
    } catch (bufferError) {
      return res.status(400).json({ 
        error: 'Erro ao processar arquivo',
        details: bufferError.message
      });
    }

    // Upload para Vercel Blob
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobFilename = `comprovantes/${boleto.numero_controle}/${timestamp}_${sanitizedFilename}`;
    
    const blob = await put(blobFilename, fileBuffer, {
      access: 'public',
      contentType: filetype || 'application/octet-stream'
    });

    // Atualizar o boleto - buscar por numero_controle como STRING
    console.log('💾 Atualizando boleto por numero_controle:', boleto_id);
    
    const updateQuery = `
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
    
    const updateResult = await pool.query(updateQuery, [
      blob.url, 
      filename, 
      filetype || 'application/octet-stream', 
      boleto_id.toString()
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Boleto não encontrado para atualização',
        numero_controle: boleto_id
      });
    }

    const boletoAtualizado = updateResult.rows[0];

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Comprovante enviado com sucesso',
      data: {
        comprovante_url: blob.url,
        filename: filename,
        numero_controle: boletoAtualizado.numero_controle,
        status: boletoAtualizado.status,
        upload_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};