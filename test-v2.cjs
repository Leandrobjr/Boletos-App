// Teste para API upload-v2.js
const https = require('https');

const data = JSON.stringify({
  boleto_id: '1761517540809',
  filename: 'test.pdf',
  filetype: 'application/pdf',
  file_data: 'data:application/pdf;base64,JVBERi0xLjQ='
});

const options = {
  hostname: 'bxc-boletos-app.vercel.app',
  port: 443,
  path: '/api/upload-v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testando API upload-v2...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Resposta:', body);
    if (res.statusCode === 200) {
      console.log('✅ SUCESSO!');
    } else {
      console.log('❌ ERRO!');
    }
  });
});

req.on('error', (e) => console.error('Erro:', e.message));
req.write(data);
req.end();