/**
 * 📤 UPLOAD DE COMPROVANTE - VERSÃO DEFINITIVA
 * Endpoint: POST /api/upload-comprovante-final
 * 
 * SOLUÇÃO DEFINITIVA:
 * - Recebe boleto_id como string (numero_controle)
 * - Busca no banco usando VARCHAR
 * - Upload para Vercel Blob
 * - Atualiza status do boleto
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

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    console.log('🚀 [DEFINITIVO] Upload de comprovante iniciado');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    // Extrair dados do body
    const { numero_controle, file_data, filename, filetype } = req.body;

    // ✅ VALIDAÇÃO DE ENTRADA
    if (!numero_controle || !file_data || !filename) {
      console.log('❌ Dados obrigatórios ausentes');
      return res.status(400).json({ 
        error: 'Dados obrigatórios: numero_controle, file_data, filename',
        received: { 
          numero_controle: !!numero_controle, 
          file_data: !!file_data, 
          filename: !!filename 
        }
      });
    }

    // ✅ PROCESSAR NUMERO_CONTROLE
    const numeroControleStr = String(numero_controle).trim();
    console.log('🔢 Numero controle processado:', numeroControleStr);

    // Validar se é numérico
    if (!/^\d+$/.test(numeroControleStr)) {
      console.log('❌ Numero controle inválido:', numeroControleStr);
      return res.status(400).json({ 
        error: 'numero_controle deve ser numérico',
        received: numero_controle,
        processed: numeroControleStr
      });
    }

    // ✅ BUSCAR BOLETO NO BANCO
    console.log('🔍 Buscando boleto no banco...');
    const boletoQuery = 'SELECT numero_controle, status, id FROM boletos WHERE numero_controle = $1 LIMIT 1';
    const boletoResult = await pool.query(boletoQuery, [numeroControleStr]);
    
    console.log('📊 Resultados da busca:', boletoResult.rows.length);

    if (boletoResult.rows.length === 0) {
      console.log('❌ Boleto não encontrado');
      return res.status(404).json({ 
        error: 'Boleto não encontrado',
        numero_controle: numeroControleStr
      });
    }

    const boleto = boletoResult.rows[0];
    console.log('✅ Boleto encontrado:', {
      numero_controle: boleto.numero_controle,
      status: boleto.status,
      id: boleto.id
    });

    // ✅ VALIDAR STATUS DO BOLETO
    const statusValidos = ['DISPONIVEL', 'TRAVADO', 'AGUARDANDO_PAGAMENTO'];
    if (!statusValidos.includes(boleto.status)) {
      console.log('❌ Status inválido para upload:', boleto.status);
      return res.status(400).json({ 
        error: 'Boleto não está disponível para upload de comprovante',
        status_atual: boleto.status,
        status_validos: statusValidos
      });
    }

    // ✅ PROCESSAR ARQUIVO
    console.log('📁 Processando arquivo...');
    let fileBuffer;
    
    try {
      // Remover prefixo data: se existir
      const base64Data = file_data.includes(',') ? file_data.split(',')[1] : file_data;
      fileBuffer = Buffer.from(base64Data, 'base64');
      console.log('✅ Arquivo processado:', {
        filename: filename,
        size: fileBuffer.length,
        type: filetype
      });
    } catch (error) {
      console.log('❌ Erro ao processar arquivo:', error.message);
      return res.status(400).json({ 
        error: 'Erro ao processar arquivo base64',
        details: error.message
      });
    }

    // ✅ UPLOAD PARA VERCEL BLOB
    console.log('☁️ Fazendo upload para Vercel Blob...');
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobPath = `comprovantes/${numeroControleStr}/${timestamp}_${sanitizedFilename}`;
    
    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      contentType: filetype || 'application/octet-stream'
    });

    console.log('✅ Upload concluído:', blob.url);

    // ✅ ATUALIZAR BOLETO NO BANCO
    console.log('💾 Atualizando boleto no banco...');
    const updateQuery = `
      UPDATE boletos 
      SET 
        comprovante_url = $1,
        comprovante_filename = $2,
        comprovante_filetype = $3,
        status = 'AGUARDANDO_BAIXA',
        upload_em = NOW()
      WHERE numero_controle = $4
      RETURNING numero_controle, status, comprovante_url
    `;
    
    const updateParams = [blob.url, filename, filetype, numeroControleStr];
    const updateResult = await pool.query(updateQuery, updateParams);
    
    if (updateResult.rows.length === 0) {
      console.log('❌ Falha na atualização do boleto');
      return res.status(500).json({ 
        error: 'Falha ao atualizar boleto após upload'
      });
    }

    const boletoAtualizado = updateResult.rows[0];
    console.log('✅ Boleto atualizado:', boletoAtualizado);

    // ✅ RESPOSTA DE SUCESSO
    const response = {
      success: true,
      message: 'Comprovante enviado com sucesso!',
      data: {
        numero_controle: boletoAtualizado.numero_controle,
        status: boletoAtualizado.status,
        comprovante_url: blob.url,
        filename: filename,
        upload_timestamp: new Date().toISOString()
      }
    };

    console.log('🎉 Upload concluído com sucesso!');
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro crítico no upload:', error);
    console.error('📍 Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};