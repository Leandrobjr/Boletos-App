/**
 * 🧪 ENDPOINT DE TESTE - Upload simples SEM Vercel Blob
 *
 * Endpoint: POST /api/test-upload
 * Objetivo: Testar se o problema de autenticação é específico do Vercel Blob
 * 
 * Este endpoint simula o processo de upload sem usar o serviço Vercel Blob,
 * apenas processando os dados e retornando uma resposta simulada.
 */

const { Pool } = require('pg');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

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

  console.log('🧪 [TEST-UPLOAD] Iniciando teste de upload SEM Vercel Blob');
  console.log('📍 Headers recebidos:', req.headers);
  console.log('📍 Body recebido:', req.body);

  try {
    const { boleto_id, file_data, filename, filetype } = req.body;

    // Validações básicas
    if (!boleto_id) {
      return res.status(400).json({ 
        error: 'ID do boleto é obrigatório',
        received_data: { boleto_id, filename, filetype, has_file_data: !!file_data }
      });
    }

    if (!file_data) {
      return res.status(400).json({ 
        error: 'Dados do arquivo são obrigatórios',
        received_data: { boleto_id, filename, filetype, has_file_data: !!file_data }
      });
    }

    // Simular processamento do arquivo (sem fazer upload real)
    const fileSize = file_data.length;
    const isBase64 = file_data.startsWith('data:');
    
    console.log(`📊 [TEST-UPLOAD] Processando arquivo: ${filename || 'sem_nome'}`);
    console.log(`📊 [TEST-UPLOAD] Tipo: ${filetype || 'não_especificado'}`);
    console.log(`📊 [TEST-UPLOAD] Tamanho: ${fileSize} caracteres`);
    console.log(`📊 [TEST-UPLOAD] É Base64: ${isBase64}`);

    // Verificar se o boleto existe no banco
    const boletoQuery = 'SELECT id, numero_controle, status FROM boletos WHERE id = $1';
    const boletoResult = await pool.query(boletoQuery, [boleto_id]);

    if (boletoResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Boleto não encontrado',
        boleto_id: boleto_id
      });
    }

    const boleto = boletoResult.rows[0];
    console.log(`📋 [TEST-UPLOAD] Boleto encontrado: ${boleto.numero_controle} (Status: ${boleto.status})`);

    // Simular URL do arquivo (sem fazer upload real)
    const simulatedUrl = `https://simulated-storage.example.com/uploads/${boleto_id}/${filename || 'arquivo'}_${Date.now()}`;

    // Atualizar boleto com URL simulada (opcional - apenas para teste completo)
    const updateQuery = `
      UPDATE boletos 
      SET comprovante_url = $1, 
          updated_at = NOW(),
          status = CASE 
            WHEN status = 'aguardando_pagamento' THEN 'comprovante_enviado'
            ELSE status 
          END
      WHERE id = $2 
      RETURNING id, numero_controle, status, comprovante_url
    `;
    
    const updateResult = await pool.query(updateQuery, [simulatedUrl, boleto_id]);
    const updatedBoleto = updateResult.rows[0];

    console.log('✅ [TEST-UPLOAD] Teste de upload concluído com sucesso');

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Teste de upload realizado com sucesso (SEM Vercel Blob)',
      data: {
        boleto_id: boleto_id,
        numero_controle: updatedBoleto.numero_controle,
        status_anterior: boleto.status,
        status_atual: updatedBoleto.status,
        arquivo: {
          nome: filename || 'arquivo_teste',
          tipo: filetype || 'application/octet-stream',
          tamanho_caracteres: fileSize,
          is_base64: isBase64
        },
        url_simulada: simulatedUrl,
        timestamp: new Date().toISOString(),
        teste_info: {
          endpoint: '/api/test-upload',
          vercel_blob_usado: false,
          objetivo: 'Isolar problema de autenticação'
        }
      }
    });

  } catch (error) {
    console.error('❌ [TEST-UPLOAD] Erro no teste:', error);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor no teste',
      details: error.message,
      teste_info: {
        endpoint: '/api/test-upload',
        vercel_blob_usado: false,
        objetivo: 'Isolar problema de autenticação'
      }
    });
  }
};