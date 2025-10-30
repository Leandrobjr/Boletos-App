/**
 * 📤 VERCEL SERVERLESS FUNCTION - Upload de comprovantes (VERSÃO FINAL)
 * Endpoint: POST /api/upload-comprovante-final
 * 
 * CORREÇÃO DEFINITIVA: Remove TODOS os casts UUID e trabalha APENAS com INTEGER
 */

const { put } = require('@vercel/blob');
const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🚀 [FINAL] Iniciando upload-comprovante...');
    console.log('📋 Body recebido:', JSON.stringify(req.body, null, 2));
    
    const { boleto_id, file_data, filename, filetype } = req.body;

    // Validação básica
    if (!boleto_id || !file_data || !filename) {
      console.log('❌ Dados obrigatórios faltando');
      return res.status(400).json({ 
        error: 'Dados obrigatórios: boleto_id, file_data, filename',
        received: { boleto_id: !!boleto_id, file_data: !!file_data, filename: !!filename }
      });
    }

    // Validar boleto_id como string numérica
    console.log('🔢 Validando boleto_id:', boleto_id);
    const numeroControle = String(boleto_id).trim();
    
    // Verificar se é uma string numérica válida
    if (!/^\d+$/.test(numeroControle) || numeroControle.length === 0) {
      console.log('❌ boleto_id inválido:', boleto_id);
      return res.status(400).json({ 
        error: 'boleto_id deve ser um número válido',
        received: boleto_id,
        processed: numeroControle
      });
    }

    console.log('✅ Número de controle válido:', numeroControle);

    // BUSCAR BOLETO - Query com STRING
    console.log('🔍 Buscando boleto no banco...');
    const boletoQuery = 'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1 LIMIT 1';
    const boletoParams = [numeroControle];
    
    console.log('📝 Query:', boletoQuery);
    console.log('📝 Params:', boletoParams);
    
    const boletoResult = await pool.query(boletoQuery, boletoParams);
    
    console.log('📊 Resultados encontrados:', boletoResult.rows.length);

    if (boletoResult.rows.length === 0) {
      console.log('❌ Boleto não encontrado');
      return res.status(404).json({ 
        error: 'Boleto não encontrado', 
        numero_controle: numeroControle 
      });
    }

    const boleto = boletoResult.rows[0];
    console.log('✅ Boleto encontrado:', boleto);

    // Processar arquivo
    console.log('📁 Processando arquivo...');
    let fileBuffer;
    try {
      if (file_data.startsWith('data:')) {
        const base64Data = file_data.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        fileBuffer = Buffer.from(file_data, 'base64');
      }
      console.log('✅ Arquivo processado. Tamanho:', fileBuffer.length, 'bytes');
    } catch (bufferError) {
      console.log('❌ Erro ao processar arquivo:', bufferError.message);
      return res.status(400).json({ 
        error: 'Erro ao processar arquivo',
        details: bufferError.message
      });
    }

    // Upload para Vercel Blob
    console.log('☁️ Fazendo upload para Vercel Blob...');
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobFilename = `comprovantes/${numeroControle}/${timestamp}_${sanitizedFilename}`;
    
    const blob = await put(blobFilename, fileBuffer, {
      access: 'public',
      contentType: filetype || 'application/octet-stream'
    });

    console.log('✅ Upload concluído. URL:', blob.url);

    // ATUALIZAR BOLETO - Query simples com INTEGER
    console.log('💾 Atualizando boleto no banco...');
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
      RETURNING numero_controle, status, comprovante_url
    `;
    
    const updateParams = [
      blob.url, 
      filename, 
      filetype || 'application/octet-stream', 
      numeroControle
    ];
    
    console.log('📝 Update Query:', updateQuery);
    console.log('📝 Update Params:', updateParams);
    
    const updateResult = await pool.query(updateQuery, updateParams);
    
    console.log('📊 Linhas atualizadas:', updateResult.rows.length);

    if (updateResult.rows.length === 0) {
      console.log('❌ Nenhuma linha foi atualizada');
      return res.status(404).json({ 
        error: 'Boleto não encontrado para atualização',
        numero_controle: numeroControle
      });
    }

    const boletoAtualizado = updateResult.rows[0];
    console.log('✅ Boleto atualizado:', boletoAtualizado);

    // Resposta de sucesso
    const response = {
      success: true,
      message: 'Comprovante enviado com sucesso!',
      data: {
        comprovante_url: blob.url,
        filename: filename,
        numero_controle: boletoAtualizado.numero_controle,
        status: boletoAtualizado.status,
        upload_timestamp: new Date().toISOString()
      }
    };

    console.log('🎉 Sucesso! Resposta:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('📍 Stack:', error.stack);
    console.error('💬 Mensagem:', error.message);
    console.error('🔍 Código:', error.code);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
};