// Proxy para comprovantes - serve diretamente o arquivo para nova aba
const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// Função para buscar boleto por qualquer ID
async function getBoletoByAnyId(id) {
  try {
    console.log('🔍 Buscando boleto por ID:', id);
    
    // Primeiro tentar por ID (UUID)
    if (id.length === 36 && id.includes('-')) {
      const result = await pool.query('SELECT * FROM boletos WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        console.log('✅ Encontrado por UUID:', id);
        return result.rows[0];
      }
    }
    
    // Depois tentar por numero_controle
    const numericId = String(id).replace(/\D/g, '');
    if (numericId.length > 0) {
      const result = await pool.query(
        'SELECT * FROM boletos WHERE numero_controle = $1',
        [numericId]
      );
      if (result.rows.length > 0) {
        console.log('✅ Encontrado por numero_controle:', numericId);
        return result.rows[0];
      }
    }
    
    console.log('❌ Boleto não encontrado para:', id);
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar boleto:', error);
    return null;
  }
}

// Função para fazer stream do comprovante
async function streamComprovanteFromSource(sourceUrl, res, filenameHint) {
  try {
    console.log('📄 Streaming comprovante from:', sourceUrl.substring(0, 100) + '...');
    
    if (sourceUrl.startsWith('data:')) {
      // Base64 data URL
      const [header, base64Data] = sourceUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
      
      // Decodificar base64
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Configurar headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${filenameHint}"`);
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutos
      
      // Enviar buffer
      res.status(200).send(buffer);
      console.log('✅ Base64 comprovante enviado');
      
    } else if (sourceUrl.startsWith('http')) {
      // URL externa
      const response = await fetch(sourceUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Transferir headers relevantes
      const contentType = response.headers.get('content-type') || 'application/pdf';
      const contentLength = response.headers.get('content-length');
      
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      res.setHeader('Content-Disposition', `inline; filename="${filenameHint}"`);
      res.setHeader('Cache-Control', 'private, max-age=300');
      
      // Stream da resposta
      const buffer = await response.arrayBuffer();
      res.status(200).send(Buffer.from(buffer));
      console.log('✅ URL externa comprovante enviado');
      
    } else {
      throw new Error('Formato de URL não suportado: ' + sourceUrl.substring(0, 50));
    }
    
  } catch (error) {
    console.error('❌ Erro no stream do comprovante:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    console.log('🔍 Proxy comprovante solicitado para ID:', req.query.id);
    
    const { id } = req.query;
    const boleto = await getBoletoByAnyId(id);
    
    if (!boleto) {
      console.log('❌ Boleto não encontrado para ID:', id);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Comprovante não encontrado</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🔍 Comprovante não encontrado</h1>
          <p>O boleto solicitado não foi localizado.</p>
          <button onclick="window.close()">Fechar</button>
        </body>
        </html>
      `);
    }
    
    if (!boleto.comprovante_url) {
      console.log('❌ Boleto sem comprovante:', id);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Comprovante não disponível</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>📄 Comprovante não disponível</h1>
          <p>Este boleto ainda não possui comprovante de pagamento.</p>
          <button onclick="window.close()">Fechar</button>
        </body>
        </html>
      `);
    }
    
    console.log('✅ Servindo comprovante via proxy:', boleto.comprovante_url.substring(0, 100) + '...');
    
    // Usar a função para stream do comprovante
    await streamComprovanteFromSource(
      boleto.comprovante_url, 
      res, 
      `comprovante-${boleto.numero_controle || boleto.id}.pdf`
    );
    
  } catch (error) {
    console.error('❌ Erro no proxy de comprovante:', error);
    
    if (!res.headersSent) {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Erro no comprovante</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>⚠️ Erro ao carregar comprovante</h1>
          <p>Ocorreu um erro interno. Tente novamente.</p>
          <button onclick="window.close()">Fechar</button>
        </body>
        </html>
      `);
    }
  }
}
