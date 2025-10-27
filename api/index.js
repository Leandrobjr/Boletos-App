/**
 * 🏠 VERCEL FUNCTION - Página principal da aplicação
 * 
 * Endpoint: GET /
 * Lógica: Serve a página principal da aplicação
 */

module.exports = async (req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Página principal simples
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BXC Boletos App</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            .status {
                background: rgba(0, 255, 0, 0.2);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid #00ff00;
            }
            .api-info {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            code {
                background: rgba(0, 0, 0, 0.3);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 BXC Boletos App</h1>
            
            <div class="status">
                <h3>✅ Aplicação Online</h3>
                <p>A aplicação está funcionando corretamente no Vercel!</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>

            <div class="api-info">
                <h3>📡 APIs Disponíveis</h3>
                <ul>
                    <li><code>POST /api/upload-comprovante</code> - Upload de comprovantes de pagamento</li>
                </ul>
            </div>

            <div class="api-info">
                <h3>🔧 Informações Técnicas</h3>
                <p><strong>Runtime:</strong> Node.js ${process.version}</p>
                <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Plataforma:</strong> Vercel Serverless Functions</p>
            </div>
        </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};