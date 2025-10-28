/**
 * 🧪 TESTE DA API UPLOAD-COMPROVANTE
 * Script para testar a funcionalidade de upload de comprovantes
 */

// Dados de teste para simular o upload - usando numero_controle numérico real da tabela
const testData = {
  boleto_id: "1761517540809", // numero_controle numérico real da tabela boletos
  filename: "Scanner_20_0409_(4).pdf",
  filetype: "application/pdf",
  file_data: "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE3NAolJUVPRgo="
};

console.log('🧪 Iniciando teste da API upload-comprovante...');
console.log('📋 Dados de teste:', {
  boleto_id: testData.boleto_id,
  filename: testData.filename,
  filetype: testData.filetype,
  file_data_length: testData.file_data.length
});

async function testUpload() {
  try {
    const response = await fetch('https://boletos-app-mocha.vercel.app/api/upload-comprovante', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📝 Resposta bruta:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta JSON:', parseError.message);
      return;
    }

    if (response.ok) {
      console.log('✅ Teste PASSOU! Resposta:', responseData);
    } else {
      console.log('❌ Teste FALHOU! Status:', response.status);
      console.log('  ', responseData);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testUpload();