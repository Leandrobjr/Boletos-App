import React, { useState } from 'react';
import { buildApiUrl } from '../config/apiConfig';

const DatabaseSchemaFixer = () => {
  const [result, setResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const verificarSchema = async () => {
    setIsChecking(true);
    setResult('🔍 Verificando conexão e schema do banco de dados...');
    
    try {
      // Primeiro, testar se a API principal está funcionando
      setResult('🔍 Testando conexão básica com a API...');
      const testResponse = await fetch(buildApiUrl('/boletos'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        throw new Error(`API principal não está respondendo: ${testResponse.status} ${testResponse.statusText}`);
      }

      setResult('✅ Conexão básica OK. Verificando schema...');
      
      // Agora tentar verificar o schema através da API principal com query param
      const response = await fetch(buildApiUrl('/boletos?verificar_schema=true'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na verificação: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Schema verificado com sucesso!

📊 Resultado:
${data.message}

${data.addedColumns && data.addedColumns.length > 0 ? 
  `🔧 Campos adicionados: ${data.addedColumns.join(', ')}` : 
  '✅ Todos os campos já existiam'
}

📋 Estrutura final da tabela:
${data.finalStructure?.map(col => 
  `• ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(opcional)' : '(obrigatório)'}`
).join('\n') || 'Estrutura não disponível'}`);
      } else {
        setResult(`❌ Erro ao verificar schema:
${data.error}
${data.details || ''}`);
      }
    } catch (error) {
      setResult(`❌ Erro de conexão:
${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ff9800', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#fff3e0'
    }}>
      <h3>🔧 Verificador de Schema do Banco</h3>
      <p>Este componente verifica se a tabela de boletos tem todos os campos necessários para a integração blockchain.</p>
      
      <button 
        onClick={verificarSchema}
        disabled={isChecking}
        style={{
          padding: '12px 24px',
          backgroundColor: isChecking ? '#ccc' : '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isChecking ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '15px'
        }}
      >
        {isChecking ? '🔄 Verificando...' : '🔍 Verificar e Corrigir Schema'}
      </button>

      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: result.includes('✅') ? '#e8f5e8' : '#ffebee',
          border: `1px solid ${result.includes('✅') ? '#4CAF50' : '#f44336'}`,
          borderRadius: '4px',
          color: result.includes('✅') ? '#2e7d32' : '#d32f2f',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <strong>📋 Resultado da Verificação:</strong>
          {result}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <h4>🎯 Campos necessários para blockchain:</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>escrow_id:</strong> ID do escrow no contrato inteligente</li>
          <li><strong>tx_hash:</strong> Hash da transação de travamento</li>
          <li><strong>data_travamento:</strong> Timestamp do travamento</li>
        </ul>
        
        <p><strong>⚠️ Importante:</strong> Execute esta verificação antes de testar o cadastro de boletos com blockchain.</p>
      </div>
    </div>
  );
};

export default DatabaseSchemaFixer;
