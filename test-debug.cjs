/**
 * 🧪 Teste da API debug-upload
 */

const fs = require('fs');

async function testDebugUpload() {
  console.log('🧪 Iniciando teste da API debug-upload...');

  // Dados de teste
  const testData = {
    boleto_id: '1761517540809', // Número de controle real
    filename: 'Scanner_20240409_(6).pdf',
    filetype: 'application/pdf',
    file_data: 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjEwIDcwIFRkCihUZXN0ZSBkZSBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjMgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTYKJSVFT0Y='
  };

  console.log('📋 Dados de teste:', {
    boleto_id: testData.boleto_id,
    filename: testData.filename,
    filetype: testData.filetype,
    file_data_length: testData.file_data.length
  });

  try {
    const response = await fetch('https://boletos-app-mocha.vercel.app/api/debug-upload', {
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
      console.log('📝 Resposta JSON:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError.message);
      console.log('📝 Resposta como texto:', responseText);
      return;
    }

    if (response.ok) {
      console.log('✅ Teste DEBUG PASSOU!');
      console.log('📊 Resultado:', responseData);
    } else {
      console.log('❌ Teste DEBUG FALHOU! Status:', response.status);
      console.log('📊 Erro:', responseData);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

// Executar o teste
testDebugUpload();