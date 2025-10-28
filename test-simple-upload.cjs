// Teste simples para API upload-final.js
const https = require('https');

const data = JSON.stringify({
  boleto_id: '123456',
  filename: 'test.pdf',
  filetype: 'application/pdf',
  file_data: 'data:application/pdf;base64,JVBERi0xLjQ='
});

const options = {
  hostname: 'bxc-boletos-app.vercel.app',
  port: 443,
  path: '/api/upload-final',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testando API upload-final...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Resposta:', body);
  });
});

req.on('error', (e) => {
  console.error('Erro:', e.message);
});

req.write(data);
req.end();