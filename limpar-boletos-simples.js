// Script simples para limpar todos os boletos
// Execute com: node limpar-boletos-simples.js

const { Pool } = require('pg');

async function limparBoletos() {
  // Use a mesma configuração do seu projeto
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🧹 Conectando ao banco de dados...');
    
    // Contar boletos
    const countResult = await pool.query('SELECT COUNT(*) FROM boletos');
    const totalBoletos = countResult.rows[0].count;
    
    console.log(`📊 Total de boletos encontrados: ${totalBoletos}`);
    
    if (totalBoletos === '0') {
      console.log('✅ Nenhum boleto para limpar');
      return;
    }
    
    // Confirmar limpeza
    console.log('⚠️ ATENÇÃO: Todos os boletos serão removidos permanentemente!');
    console.log('🔄 Removendo todos os boletos...');
    
    // Limpar todos os boletos
    const deleteResult = await pool.query('DELETE FROM boletos');
    
    console.log(`🗑️ Boletos removidos: ${deleteResult.rowCount}`);
    console.log('✅ Limpeza concluída com sucesso!');
    console.log('🎉 Banco de dados limpo - pronto para novos boletos');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

limparBoletos();

