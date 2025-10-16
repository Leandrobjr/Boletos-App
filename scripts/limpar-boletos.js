const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limparTodosBoletos() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Iniciando limpeza de todos os boletos...');
    
    // Contar boletos antes da limpeza
    const countBefore = await client.query('SELECT COUNT(*) FROM boletos');
    console.log(`📊 Boletos encontrados: ${countBefore.rows[0].count}`);
    
    if (countBefore.rows[0].count === '0') {
      console.log('✅ Nenhum boleto encontrado para limpar');
      return;
    }
    
    // Limpar todos os boletos
    const result = await client.query('DELETE FROM boletos');
    console.log(`🗑️ Boletos removidos: ${result.rowCount}`);
    
    // Verificar se a limpeza foi bem-sucedida
    const countAfter = await client.query('SELECT COUNT(*) FROM boletos');
    console.log(`📊 Boletos restantes: ${countAfter.rows[0].count}`);
    
    if (countAfter.rows[0].count === '0') {
      console.log('✅ Limpeza concluída com sucesso!');
      console.log('🎉 Banco de dados limpo - pronto para novos boletos');
    } else {
      console.log('⚠️ Ainda existem boletos no banco');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar boletos:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar limpeza
limparTodosBoletos()
  .then(() => {
    console.log('🏁 Script de limpeza finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });

