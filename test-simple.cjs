/**
 * 🧪 TESTE DA API SIMPLES
 * Testa a API test-simple que faz apenas query básica sem UUID
 */

const https = require('https');

// Dados de teste
const testData = {
  numero_controle: '1761517540809'
};

console.log('🧪 Iniciando teste da API test-simple...');
console.log('📋 Dados de teste:', testData);

const postData = JSON.stringify(testData);

const options = {
  hostname: 'boletos-app-mocha.vercel.app',
  port: 443,
  path: '/api/test-simple',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log('📊 Status da resposta:', res.statusCode);
  console.log('📋 Headers da resposta:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📝 Resposta bruta:', data);
    
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ Teste PASSOU! Resposta:', response);
      } else {
        console.log('❌ Teste FALHOU! Status:', res.statusCode);
        console.log('📝 Erro:', response);
      }
    } catch (parseError) {
      console.log('❌ Erro ao fazer parse da resposta:', parseError.message);
      console.log('📝 Resposta como texto:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});

req.write(postData);
req.end();