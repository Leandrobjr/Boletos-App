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
    console.log('📝 Headers:', req.headers);
    console.log('📝 Body type:', typeof req.body);
    console.log('📝 Body keys:', req.body ? Object.keys(req.body) : 'null');
    console.log('🔗 DATABASE_URL existe:', !!process.env.DATABASE_URL);
    
    // Validação mais robusta do body
    if (!req.body) {
      console.error('❌ Body está vazio ou null');
      return res.status(400).json({ 
        error: 'Body da requisição está vazio',
        received: req.body
      });
    }

    const { boleto_id, file_data, filename, filetype } = req.body;

    console.log('📋 Dados recebidos:', {
      boleto_id: boleto_id ? 'presente' : 'ausente',
      file_data: file_data ? `${file_data.length} chars` : 'ausente',
      filename: filename || 'ausente',
      filetype: filetype || 'ausente'
    });

    if (!boleto_id || !file_data || !filename) {
      console.error('❌ Dados obrigatórios ausentes:', { boleto_id, filename, file_data_length: file_data?.length });
      return res.status(400).json({ 
        error: 'Dados obrigatórios: boleto_id, file_data, filename',
        received: {
          boleto_id: !!boleto_id,
          file_data: !!file_data,
          filename: !!filename
        }
      });
    }

    // Verificar se o boleto existe
    console.log('🔍 Verificando boleto:', boleto_id);
    const isNumeric = /^\d+$/.test(boleto_id);
    let boletoQuery;
    
    if (isNumeric) {
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE id = $1',
        [parseInt(boleto_id)]
      );
    } else {
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1::uuid',
        [boleto_id]
      );
    }

    console.log('📊 Resultado da query:', boletoQuery.rows.length, 'boletos encontrados');

    if (boletoQuery.rows.length === 0) {
      console.error('❌ Boleto não encontrado:', boleto_id);
      return res.status(404).json({ error: 'Boleto não encontrado', boleto_id });
    }

    const boleto = boletoQuery.rows[0];
    console.log('✅ Boleto encontrado:', boleto.numero_controle, 'Status:', boleto.status);

    // Validar e converter base64 para Buffer
    console.log('🔄 Processando arquivo...');
    let fileBuffer;
    try {
      if (file_data.startsWith('data:')) {
        const base64Data = file_data.split(',')[1];
        if (!base64Data) {
          throw new Error('Dados base64 inválidos após data URL');
        }
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        fileBuffer = Buffer.from(file_data, 'base64');
      }
      
      if (fileBuffer.length === 0) {
        throw new Error('Buffer do arquivo está vazio');
      }
      
      console.log('📁 Arquivo processado:', fileBuffer.length, 'bytes');
    } catch (bufferError) {
      console.error('❌ Erro ao processar arquivo:', bufferError.message);
      return res.status(400).json({ 
        error: 'Erro ao processar arquivo',
        details: bufferError.message
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobFilename = `comprovantes/${boleto.numero_controle}/${timestamp}_${sanitizedFilename}`;
    
    console.log('📂 Nome do arquivo no blob:', blobFilename);

    // Upload para Vercel Blob
    console.log('☁️ Fazendo upload para Vercel Blob...');
    let blob;
    try {
      blob = await put(blobFilename, fileBuffer, {
        access: 'public',
        contentType: filetype || 'application/octet-stream'
      });
      console.log('✅ Upload concluído:', blob.url);
    } catch (blobError) {
      console.error('❌ Erro no upload para blob:', blobError.message);
      return res.status(500).json({ 
        error: 'Erro no upload do arquivo',
        details: blobError.message
      });
    }

    // Atualizar boleto no banco
    console.log('💾 Atualizando boleto no banco...');
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
        WHERE numero_controle = $4::uuid
        RETURNING *
      `;
      updateParams = [blob.url, filename, filetype || 'application/octet-stream', boleto_id];
    }

    let updateResult;
    try {
      updateResult = await pool.query(updateQuery, updateParams);
      console.log('📊 Resultado do update:', updateResult.rows.length, 'linhas afetadas');
    } catch (dbError) {
      console.error('❌ Erro na atualização do banco:', dbError.message);
      return res.status(500).json({ 
        error: 'Erro ao atualizar boleto no banco',
        details: dbError.message
      });
    }

    if (updateResult.rows.length === 0) {
      console.error('❌ Nenhuma linha foi atualizada no banco');
      return res.status(500).json({ error: 'Falha ao atualizar boleto' });
    }

    const boletoAtualizado = updateResult.rows[0];
    console.log('✅ Boleto atualizado com sucesso:', boletoAtualizado.numero_controle);

    // Resposta de sucesso
    const response = {
      success: true,
      message: 'Comprovante enviado com sucesso',
      data: {
        comprovante_url: blob.url,
        filename: filename,
        boleto_id: boleto_id,
        status: boletoAtualizado.status,
        upload_timestamp: new Date().toISOString()
      }
    };

    console.log('🎉 Resposta de sucesso:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro detalhado no upload:', error);
    console.error('📍 Stack trace:', error.stack);
    console.error('🔍 Tipo do erro:', error.name);
    console.error('💬 Mensagem:', error.message);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};