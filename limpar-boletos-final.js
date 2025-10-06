// Script para limpar todos os boletos usando a mesma configuração do projeto
const { Pool } = require('pg');

async function limparTodosBoletos() {
  // Usar a mesma configuração do api/boletos.js
  const connectionString = 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5
  });

  try {
    console.log('🧹 Conectando ao banco de dados Neon...');
    
    // Contar boletos antes
    const countResult = await pool.query('SELECT COUNT(*) FROM boletos');
    const totalBoletos = countResult.rows[0].count;
    
    console.log(`📊 Total de boletos encontrados: ${totalBoletos}`);
    
    if (totalBoletos === '0') {
      console.log('✅ Nenhum boleto para limpar');
      return;
    }
    
    console.log('⚠️ ATENÇÃO: Todos os boletos serão removidos permanentemente!');
    console.log('🔄 Removendo todos os boletos...');
    
    // Limpar todos os boletos
    const deleteResult = await pool.query('DELETE FROM boletos');
    
    console.log(`🗑️ Boletos removidos: ${deleteResult.rowCount}`);
    
    // Verificar se foi limpo
    const countAfter = await pool.query('SELECT COUNT(*) FROM boletos');
    console.log(`📊 Boletos restantes: ${countAfter.rows[0].count}`);
    
    if (countAfter.rows[0].count === '0') {
      console.log('✅ Limpeza concluída com sucesso!');
      console.log('🎉 Banco de dados limpo - pronto para novos boletos');
    } else {
      console.log('⚠️ Ainda existem boletos no banco');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await pool.end();
    console.log('🔌 Conexão com banco encerrada');
  }
}

console.log('🚀 Iniciando limpeza de boletos...');
limparTodosBoletos();

