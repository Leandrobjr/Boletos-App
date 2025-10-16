const { Pool } = require('pg');

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_dPQtsIq53OVc',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function corrigir() {
  try {
    // 1. Zera todos os vencimentos inválidos (não data) para NULL, convertendo para texto
    await pool.query(`
      UPDATE boletos
      SET vencimento = NULL
      WHERE
        vencimento IS NOT NULL
        AND (
          TRIM(vencimento::text) = ''
          OR NOT vencimento::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        )
    `);
    // 2. Atualiza todos os NULL para uma data válida
    const res = await pool.query("UPDATE boletos SET vencimento = '2025-12-31' WHERE vencimento IS NULL");
    console.log('Boletos corrigidos:', res.rowCount);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao corrigir boletos:', err);
    process.exit(1);
  }
}

corrigir(); 