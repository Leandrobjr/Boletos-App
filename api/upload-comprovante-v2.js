/**
 * 📤 UPLOAD DE COMPROVANTES - VERSÃO FINAL CORRIGIDA
 * Endpoint: POST /api/upload-comprovante-v2
 * 
 * CORREÇÃO DEFINITIVA: Remove completamente qualquer uso de UUID
 * Trabalha EXCLUSIVAMENTE com numero_controle como INTEGER
 */

const { put } = require('@vercel/blob');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    console.log('🚀 UPLOAD V2 - Iniciando...');
    
    const { boleto_id, file_data, filename, filetype } = req.body;

    // Validação básica
    if (!boleto_id || !file_data || !filename) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: boleto_id, file_data, filename'
      });
    }

    // Converter boleto_id para INTEGER (numero_controle)
    const numeroControle = parseInt(String(boleto_id).trim());
    if (isNaN(numeroControle) || numeroControle <= 0) {
      return res.status(400).json({ 
        error: 'boleto_id deve ser um número positivo válido',
        received: boleto_id
      });
    }

    console.log('🔍 Buscando boleto com numero_controle:', numeroControle);

    // Buscar boleto APENAS por numero_controle (INTEGER)
    const boleto = await pool.query(
      'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1 LIMIT 1',
      [numeroControle]
    );

    if (boleto.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Boleto não encontrado',
        numero_controle: numeroControle
      });
    }

    console.log('✅ Boleto encontrado:', boleto.rows[0]);

    // Processar arquivo base64
    let fileBuffer;
    try {
      const base64Data = file_data.includes(',') ? file_data.split(',')[1] : file_data;
      fileBuffer = Buffer.from(base64Data, 'base64');
      
      if (fileBuffer.length === 0) {
        throw new Error('Arquivo vazio');
      }
    } catch (err) {
      return res.status(400).json({ 
        error: 'Erro ao processar arquivo base64',
        details: err.message
      });
    }

    // Upload para Vercel Blob
    const timestamp = Date.now();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobPath = `comprovantes/${numeroControle}/${timestamp}_${cleanFilename}`;
    
    console.log('☁️ Fazendo upload:', blobPath);
    
    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      contentType: filetype || 'application/pdf'
    });

    console.log('✅ Upload concluído:', blob.url);

    // Atualizar boleto APENAS por numero_controle (INTEGER)
    console.log('💾 Atualizando boleto...');
    
    const updateResult = await pool.query(`
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
      RETURNING numero_controle, status, comprovante_url
    `, [blob.url, filename, filetype || 'application/pdf', numeroControle]);

    if (updateResult.rows.length === 0) {
      return res.status(500).json({ 
        error: 'Falha ao atualizar boleto',
        numero_controle: numeroControle
      });
    }

    const boletoAtualizado = updateResult.rows[0];
    console.log('✅ Boleto atualizado:', boletoAtualizado);

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Comprovante enviado com sucesso!',
      data: {
        numero_controle: boletoAtualizado.numero_controle,
        status: boletoAtualizado.status,
        comprovante_url: boletoAtualizado.comprovante_url,
        filename: filename,
        upload_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('📍 Stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};