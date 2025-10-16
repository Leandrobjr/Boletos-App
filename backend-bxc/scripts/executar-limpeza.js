#!/usr/bin/env node
// Script para limpar boletos expirados diretamente no banco Neon

const { Pool } = require('pg');

// Configuração do banco (usando a connection string do backend)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function limparBoletosExpirados() {
  try {
    console.log('🔍 Conectando ao banco Neon...');
    
    // Primeiro, verificar a estrutura da tabela
    console.log('\n📊 Verificando estrutura da tabela...\n');
    const estrutura = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'boletos'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas disponíveis:');
    estrutura.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    // Verificar se a coluna comprador_id existe
    const temCompradorId = estrutura.rows.some(col => col.column_name === 'comprador_id');
    console.log(`Coluna comprador_id existe: ${temCompradorId ? 'SIM' : 'NÃO'}\n`);
    
    // 1. VERIFICAR BOLETOS QUE SERÃO LIMPOS
    console.log('📊 PASSO 1: Verificando boletos expirados...\n');
    
    const selectQuery = temCompradorId 
      ? `SELECT 
          id,
          numero_controle,
          status,
          data_travamento,
          comprador_id,
          wallet_address,
          EXTRACT(EPOCH FROM (NOW() - data_travamento))/60 AS minutos_travado
        FROM boletos
        WHERE 
          status IN ('AGUARDANDO_PAGAMENTO', 'PENDENTE_PAGAMENTO')
          AND data_travamento IS NOT NULL
          AND data_travamento < NOW() - INTERVAL '1 hour'
        ORDER BY data_travamento ASC`
      : `SELECT 
          id,
          numero_controle,
          status,
          data_travamento,
          wallet_address,
          EXTRACT(EPOCH FROM (NOW() - data_travamento))/60 AS minutos_travado
        FROM boletos
        WHERE 
          status IN ('AGUARDANDO_PAGAMENTO', 'PENDENTE_PAGAMENTO')
          AND data_travamento IS NOT NULL
          AND data_travamento < NOW() - INTERVAL '1 hour'
        ORDER BY data_travamento ASC`;
    
    const boletosParaLimpar = await pool.query(selectQuery);
    
    if (boletosParaLimpar.rowCount === 0) {
      console.log('✅ Nenhum boleto expirado encontrado. Tudo certo!');
      await pool.end();
      return;
    }
    
    console.log(`⚠️  Encontrados ${boletosParaLimpar.rowCount} boletos expirados:\n`);
    boletosParaLimpar.rows.forEach((boleto, index) => {
      console.log(`${index + 1}. Boleto ${boleto.numero_controle}`);
      console.log(`   - Status: ${boleto.status}`);
      console.log(`   - Travado há: ${Math.floor(boleto.minutos_travado)} minutos`);
      if (temCompradorId) {
        console.log(`   - Comprador ID: ${boleto.comprador_id || 'N/A'}`);
      }
      console.log('');
    });
    
    // 2. LIMPAR BOLETOS EXPIRADOS
    console.log('🧹 PASSO 2: Limpando boletos expirados...\n');
    
    const updateQuery = temCompradorId
      ? `UPDATE boletos 
         SET 
           status = 'DISPONIVEL',
           comprador_id = NULL,
           wallet_address = NULL,
           data_travamento = NULL,
           data_destravamento = NOW()
         WHERE 
           status IN ('AGUARDANDO_PAGAMENTO', 'PENDENTE_PAGAMENTO')
           AND data_travamento IS NOT NULL
           AND data_travamento < NOW() - INTERVAL '1 hour'`
      : `UPDATE boletos 
         SET 
           status = 'DISPONIVEL',
           wallet_address = NULL,
           data_travamento = NULL,
           data_destravamento = NOW()
         WHERE 
           status IN ('AGUARDANDO_PAGAMENTO', 'PENDENTE_PAGAMENTO')
           AND data_travamento IS NOT NULL
           AND data_travamento < NOW() - INTERVAL '1 hour'`;
    
    const resultado = await pool.query(updateQuery);
    
    console.log(`✅ ${resultado.rowCount} boletos foram limpos e retornaram para DISPONIVEL!\n`);
    
    // 3. VERIFICAR RESULTADO
    console.log('📊 PASSO 3: Verificando resultado...\n');
    
    const verificacaoQuery = temCompradorId
      ? `SELECT 
          id,
          numero_controle,
          status,
          data_destravamento,
          comprador_id
        FROM boletos
        WHERE 
          data_destravamento IS NOT NULL
          AND data_destravamento > NOW() - INTERVAL '5 minutes'
        ORDER BY data_destravamento DESC
        LIMIT 10`
      : `SELECT 
          id,
          numero_controle,
          status,
          data_destravamento
        FROM boletos
        WHERE 
          data_destravamento IS NOT NULL
          AND data_destravamento > NOW() - INTERVAL '5 minutes'
        ORDER BY data_destravamento DESC
        LIMIT 10`;
    
    const verificacao = await pool.query(verificacaoQuery);
    
    if (verificacao.rowCount > 0) {
      console.log(`✅ Últimos ${verificacao.rowCount} boletos destravados:\n`);
      verificacao.rows.forEach((boleto, index) => {
        console.log(`${index + 1}. Boleto ${boleto.numero_controle}`);
        console.log(`   - Status atual: ${boleto.status}`);
        console.log(`   - Destravado em: ${new Date(boleto.data_destravamento).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    // 4. ESTATÍSTICAS FINAIS
    console.log('📊 ESTATÍSTICAS FINAIS:\n');
    const stats = await pool.query(`
      SELECT 
        status,
        COUNT(*) AS quantidade
      FROM boletos
      GROUP BY status
      ORDER BY quantidade DESC
    `);
    
    stats.rows.forEach(stat => {
      console.log(`${stat.status}: ${stat.quantidade} boletos`);
    });
    
    console.log('\n✅ Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar boletos:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Executar
limparBoletosExpirados();
