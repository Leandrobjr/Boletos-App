/**
 * 📤 VERCEL FUNCTION - Upload direto de comprovantes via Vercel Blob
 *
 * Endpoint: POST /api/upload-comprovante
 * Lógica:
 * - Recebe arquivo via FormData ou base64
 * - Faz upload direto para Vercel Blob (bypass do limite 4.5MB)
 * - Retorna URL pública do arquivo
 * - Atualiza boleto com a URL do comprovante
 */

const { put } = require('@vercel/blob');
const { Pool } = require('pg');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

// Configuração do banco - só usar PostgreSQL em produção
let pool = null;
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

if (isProduction) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: {
      rejectUnauthorized: false
    }
  });
}

module.exports = async (req, res) => {
  // Adicionar headers CORS
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  console.log('📤 [UPLOAD] Iniciando upload de comprovante via Vercel Blob');

  try {
    const { boleto_id, file_data, filename, filetype } = req.body;

    if (!boleto_id || !file_data || !filename) {
      return res.status(400).json({ 
        error: 'Dados obrigatórios: boleto_id, file_data, filename' 
      });
    }

    // Verificar se o boleto existe
    // Corrigir comparação de tipos: tratar id como UUID ou INTEGER dependendo do formato
    let boletoQuery;
    // Verificar se estamos em produção para usar PostgreSQL
    if (!isProduction || !pool) {
      return res.status(503).json({ 
        error: 'Serviço disponível apenas em produção',
        message: 'Upload de comprovante funciona apenas no ambiente de produção com banco PostgreSQL'
      });
    }

    let queryParams;
    
    // Verificar se boleto_id parece ser um UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(boleto_id);
    const isNumeric = /^\d+$/.test(boleto_id);
    
    if (isUUID) {
      // Se é UUID, comparar apenas com id
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE id = $1',
        [boleto_id]
      );
    } else if (isNumeric) {
      // Se é numérico, pode ser id INTEGER ou numero_controle
      // CORREÇÃO: Evitar conversão de UUID para text, usar apenas numero_controle
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1',
        [boleto_id]
      );
    } else {
      // Se não é UUID nem numérico, tratar apenas como numero_controle
      boletoQuery = await pool.query(
        'SELECT numero_controle, status FROM boletos WHERE numero_controle = $1',
        [boleto_id]
      );
    }

    if (boletoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }

    const boleto = boletoQuery.rows[0];
    console.log('📋 [UPLOAD] Boleto encontrado:', boleto.numero_controle);

    // Converter base64 para Buffer se necessário
    let fileBuffer;
    if (file_data.startsWith('data:')) {
      // Remover header do base64
      const base64Data = file_data.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      fileBuffer = Buffer.from(file_data, 'base64');
    }

    console.log('📊 [UPLOAD] Tamanho do arquivo:', (fileBuffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobFilename = `comprovantes/${boleto.numero_controle}/${timestamp}_${sanitizedFilename}`;

    // Upload para Vercel Blob
    console.log('☁️ [UPLOAD] Enviando para Vercel Blob:', blobFilename);
    
    const blob = await put(blobFilename, fileBuffer, {
      access: 'public',
      contentType: filetype || 'application/octet-stream'
    });

    console.log('✅ [UPLOAD] Upload concluído:', blob.url);

    // Atualizar boleto no banco com a URL do comprovante
    // Usar a mesma lógica de detecção de tipo para o UPDATE
    let updateQuery;
    let updateParams;
    
    if (isUUID) {
      // Se é UUID, atualizar apenas por id
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
      updateParams = [blob.url, filename, filetype || 'application/octet-stream', boleto_id];
    } else if (isNumeric) {
      // Se é numérico, usar apenas numero_controle para evitar erro de conversão
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
    } else {
      // Se não é UUID nem numérico, atualizar apenas por numero_controle
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
      console.error('❌ [UPLOAD] Falha ao atualizar boleto no banco');
      return res.status(500).json({ error: 'Falha ao atualizar boleto' });
    }

    const boletoAtualizado = updateResult.rows[0];
    console.log('📝 [UPLOAD] Boleto atualizado:', boletoAtualizado.numero_controle, '- Status:', boletoAtualizado.status);

    // Resposta de sucesso
    res.status(200).json({
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
    console.error('❌ [UPLOAD] Erro no upload:', error);
    console.error('❌ [UPLOAD] Stack trace:', error.stack);
    console.error('❌ [UPLOAD] Error name:', error.name);
    console.error('❌ [UPLOAD] Error code:', error.code);
    
    // Erro específico do Vercel Blob
    if (error.message?.includes('blob')) {
      return res.status(500).json({ 
        error: 'Erro no serviço de armazenamento',
        details: 'Verifique a configuração do BLOB_READ_WRITE_TOKEN'
      });
    }

    // Erro específico do banco de dados
    if (error.code === '42883' || error.message?.includes('operator does not exist')) {
      console.error('❌ [UPLOAD] Erro de tipo de dados PostgreSQL:', error.message);
      return res.status(500).json({ 
        error: 'Erro de tipo de dados no banco',
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};