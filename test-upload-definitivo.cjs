/**
 * 🧪 TESTE DA VERSÃO DEFINITIVA DO UPLOAD
 * Testa o endpoint /api/upload-comprovante-final
 */

const fs = require('fs');
const path = require('path');

// Simular arquivo base64
const createTestFile = () => {
  const testContent = 'Comprovante de pagamento - Teste Definitivo';
  return Buffer.from(testContent).toString('base64');
};

const testUpload = async () => {
  console.log('🧪 TESTE DEFINITIVO - Upload de Comprovante');
  console.log('=' .repeat(50));

  // Dados de teste
  const testData = {
    boleto_id: '1761517540809', // String numérica
    file_data: `data:text/plain;base64,${createTestFile()}`,
    filename: 'comprovante-teste-definitivo.txt',
    filetype: 'text/plain'
  };

  console.log('📋 Dados de teste:');
  console.log('- boleto_id:', testData.boleto_id, '(tipo:', typeof testData.boleto_id, ')');
  console.log('- filename:', testData.filename);
  console.log('- filetype:', testData.filetype);
  console.log('- file_data length:', testData.file_data.length);

  try {
    // Importar e executar a função
    const uploadFunction = require('./api/upload-comprovante-final.js');
    
    // Mock do request/response
    const mockReq = {
      method: 'POST',
      body: testData
    };

    const mockRes = {
      headers: {},
      statusCode: 200,
      responseData: null,
      
      setHeader(name, value) {
        this.headers[name] = value;
      },
      
      status(code) {
        this.statusCode = code;
        return this;
      },
      
      json(data) {
        this.responseData = data;
        console.log(`📤 Resposta (${this.statusCode}):`, JSON.stringify(data, null, 2));
        return this;
      },
      
      end() {
        console.log('✅ Resposta OPTIONS enviada');
        return this;
      }
    };

    console.log('\n🚀 Executando upload...');
    await uploadFunction(mockReq, mockRes);

    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('- Status Code:', mockRes.statusCode);
    console.log('- Success:', mockRes.responseData?.success);
    console.log('- Message:', mockRes.responseData?.message);
    
    if (mockRes.responseData?.data) {
      console.log('- Numero Controle:', mockRes.responseData.data.numero_controle);
      console.log('- Status:', mockRes.responseData.data.status);
      console.log('- URL:', mockRes.responseData.data.comprovante_url);
    }

    if (mockRes.statusCode === 200) {
      console.log('\n🎉 TESTE PASSOU! Upload funcionando corretamente.');
    } else {
      console.log('\n❌ TESTE FALHOU! Verificar logs acima.');
    }

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('📍 Stack:', error.stack);
  }
};

// Executar teste
testUpload();