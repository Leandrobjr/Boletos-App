/**
 * 📤 API UPLOAD V2 - Versão simplificada sem UUID
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { boleto_id, file_data, filename, filetype } = req.body;

    if (!boleto_id || !file_data || !filename) {
      return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
    }

    // Converter para inteiro
    const numeroControle = parseInt(boleto_id);
    if (isNaN(numeroControle)) {
      return res.status(400).json({ error: 'boleto_id inválido' });
    }

    // Buscar boleto
    const boletoResult = await pool.query(
      'SELECT * FROM boletos WHERE numero_controle = $1',
      [numeroControle]
    );

    if (boletoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }

    // Processar arquivo
    const base64Data = file_data.includes(',') ? file_data.split(',')[1] : file_data;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Upload
    const blobName = `comprovantes/${numeroControle}/${Date.now()}_${filename}`;
    const blob = await put(blobName, fileBuffer, {
      access: 'public',
      contentType: filetype || 'application/pdf'
    });

    // Atualizar boleto
    const updateResult = await pool.query(
      `UPDATE boletos 
       SET comprovante_url = $1, comprovante_filename = $2, upload_em = NOW(),
           status = CASE WHEN status = 'TRAVADO' THEN 'AGUARDANDO_BAIXA' ELSE status END
       WHERE numero_controle = $3 
       RETURNING *`,
      [blob.url, filename, numeroControle]
    );

    return res.status(200).json({
      success: true,
      message: 'Upload realizado com sucesso',
      data: {
        url: blob.url,
        filename: filename,
        numero_controle: numeroControle,
        status: updateResult.rows[0].status
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      details: error.message 
    });
  }
};