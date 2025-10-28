/**
 * 🚀 API FINAL DE UPLOAD - VERSÃO DEFINITIVA
 * Esta API foi criada para resolver definitivamente todos os problemas
 */

import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Log detalhado para debug
  console.log('🔍 [UPLOAD-FINAL] Método:', req.method);
  console.log('🔍 [UPLOAD-FINAL] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 [UPLOAD-FINAL] Body type:', typeof req.body);

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ [UPLOAD-FINAL] Respondendo OPTIONS');
    return res.status(200).end();
  }

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    console.log('❌ [UPLOAD-FINAL] Método não permitido:', req.method);
    return res.status(405).json({ 
      error: 'Método não permitido',
      method: req.method,
      allowed: ['POST']
    });
  }

  try {
    console.log('🔄 [UPLOAD-FINAL] Processando upload...');

    // Extrair dados do body
    const { boleto_id, filename, filetype, file_data } = req.body;

    console.log('📋 [UPLOAD-FINAL] Dados recebidos:', {
      boleto_id: boleto_id,
      filename: filename,
      filetype: filetype,
      file_data_length: file_data ? file_data.length : 0
    });

    // Validar dados obrigatórios
    if (!boleto_id || !filename || !filetype || !file_data) {
      console.log('❌ [UPLOAD-FINAL] Dados obrigatórios faltando');
      return res.status(400).json({
        error: 'Dados obrigatórios faltando',
        required: ['boleto_id', 'filename', 'filetype', 'file_data']
      });
    }

    // Converter boleto_id para número inteiro
    const numeroControle = parseInt(boleto_id, 10);
    console.log('🔢 [UPLOAD-FINAL] Número de controle:', numeroControle);

    if (isNaN(numeroControle)) {
      console.log('❌ [UPLOAD-FINAL] ID do boleto inválido');
      return res.status(400).json({
        error: 'ID do boleto deve ser um número válido',
        received: boleto_id
      });
    }

    // Verificar se o boleto existe
    console.log('🔍 [UPLOAD-FINAL] Verificando se boleto existe...');
    const boletoCheck = await sql`
      SELECT numero_controle, status 
      FROM boletos 
      WHERE numero_controle = ${numeroControle}
    `;

    if (boletoCheck.rows.length === 0) {
      console.log('❌ [UPLOAD-FINAL] Boleto não encontrado');
      return res.status(404).json({
        error: 'Boleto não encontrado',
        numero_controle: numeroControle
      });
    }

    console.log('✅ [UPLOAD-FINAL] Boleto encontrado:', boletoCheck.rows[0]);

    // Processar arquivo base64
    console.log('📁 [UPLOAD-FINAL] Processando arquivo...');
    const base64Data = file_data.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    console.log('📊 [UPLOAD-FINAL] Tamanho do arquivo:', buffer.length, 'bytes');

    // Upload para Vercel Blob
    console.log('☁️ [UPLOAD-FINAL] Fazendo upload para Vercel Blob...');
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: filetype
    });

    console.log('✅ [UPLOAD-FINAL] Upload concluído:', blob.url);

    // Atualizar banco de dados
    console.log('💾 [UPLOAD-FINAL] Atualizando banco de dados...');
    const updateResult = await sql`
      UPDATE boletos 
      SET 
        comprovante_url = ${blob.url},
        comprovante_filename = ${filename},
        status = 'comprovante_enviado',
        updated_at = NOW()
      WHERE numero_controle = ${numeroControle}
      RETURNING numero_controle, comprovante_url, status
    `;

    if (updateResult.rows.length === 0) {
      console.log('❌ [UPLOAD-FINAL] Falha ao atualizar banco');
      return res.status(500).json({
        error: 'Falha ao atualizar banco de dados'
      });
    }

    console.log('✅ [UPLOAD-FINAL] Banco atualizado:', updateResult.rows[0]);

    // Resposta de sucesso
    const response = {
      success: true,
      message: 'Comprovante enviado com sucesso',
      data: {
        numero_controle: numeroControle,
        comprovante_url: blob.url,
        filename: filename,
        status: 'comprovante_enviado',
        upload_size: buffer.length
      }
    };

    console.log('🎉 [UPLOAD-FINAL] Sucesso completo:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 [UPLOAD-FINAL] Erro:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}