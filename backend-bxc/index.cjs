const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_dPQtsIq53OVc',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Criação das tabelas se não existirem
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      firebase_uid VARCHAR(64) PRIMARY KEY,
      nome VARCHAR(255),
      email VARCHAR(255),
      telefone VARCHAR(30),
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS boletos (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(64),
      cpf_cnpj VARCHAR(32),
      codigo_barras VARCHAR(64),
      valor NUMERIC(12,2),
      vencimento DATE,
      instituicao VARCHAR(64),
      status VARCHAR(32) DEFAULT 'pendente',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      numero_controle VARCHAR(16)
    );
  `);
  console.log('Tabelas verificadas/criadas com sucesso!');
}
initDb();

// Função utilitária para mapear status antigos para o novo padrão
function mapStatus(status) {
  switch ((status || '').toLowerCase()) {
    case 'pendente': return 'DISPONIVEL';
    case 'pago': return 'BAIXADO';
    case 'reservado': return 'AGUARDANDO PAGAMENTO';
    case 'cancelado': return 'EXCLUIDO';
    default: return status ? status.toUpperCase() : status;
  }
}

// Salvar/atualizar perfil do usuário
app.post('/perfil', async (req, res) => {
  console.log('Recebido no POST /perfil:', req.body);
  const { firebase_uid, nome, email, telefone } = req.body;
  try {
    await pool.query(`
      INSERT INTO users (firebase_uid, nome, email, telefone)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (firebase_uid) DO UPDATE SET nome = $2, email = $3, telefone = $4
    `, [firebase_uid, nome, email, telefone]);
    res.send('Perfil salvo!');
  } catch (error) {
    console.error('Erro ao salvar no banco:', error);
    res.status(500).json({ error: 'Erro ao salvar no banco' });
  }
});

// Buscar perfil do usuário
app.get('/perfil/:firebase_uid', async (req, res) => {
  const { firebase_uid } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Criar novo boleto
app.post('/boletos', async (req, res) => {
  console.log('DEBUG BACKEND req.body:', req.body);
  const { user_id, cpfCnpj, codigoBarras, valor_brl, valor_usdt, valorUsdt, vencimento, instituicao, status, numeroControle } = req.body;
  let vencimentoFormatado = null;
  if (vencimento) {
    const d = new Date(vencimento);
    if (!isNaN(d.getTime())) {
      vencimentoFormatado = d.toISOString().split('T')[0];
    } else {
      return res.status(400).json({ error: 'Data de vencimento inválida. Use o formato YYYY-MM-DD.' });
    }
  } else {
    return res.status(400).json({ error: 'Data de vencimento obrigatória.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO boletos (user_id, cpf_cnpj, codigo_barras, valor_brl, valor_usdt, vencimento, instituicao, status, numero_controle)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [user_id, cpfCnpj, codigoBarras, valor_brl, valor_usdt || valorUsdt, vencimentoFormatado, instituicao, mapStatus(status || 'pendente'), numeroControle]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[BACKEND] Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro ao criar boleto', detalhe: error.message });
  }
});

// Listar todos os boletos
app.get('/boletos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boletos ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar boletos:', error);
    res.status(500).json({ error: 'Erro ao listar boletos' });
  }
});

// Listar boletos por usuário
app.get('/boletos/usuario/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const sql = 'SELECT * FROM boletos WHERE user_id = $1 ORDER BY criado_em DESC';
    const result = await pool.query(sql, [uid]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar boletos do usuário' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});