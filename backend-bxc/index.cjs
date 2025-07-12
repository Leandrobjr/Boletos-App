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

async function initDb() {
  // Criação das tabelas se não existirem
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      firebase_uid VARCHAR(64) UNIQUE,
      nome TEXT,
      email TEXT UNIQUE,
      telefone TEXT,
      tipo TEXT,
      criado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS boletos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES users(id),
      codigo_barras TEXT,
      cpf_cnpj TEXT,
      valor_brl NUMERIC(12,2),
      valor_usdt NUMERIC(12,2),
      cotacao_usdt NUMERIC(12,4),
      data_vencimento DATE,
      instituicao TEXT,
      status TEXT,
      criado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transacoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      boleto_id UUID REFERENCES boletos(id),
      usuario_id UUID REFERENCES users(id),
      tipo TEXT,
      valor NUMERIC(12,2),
      data TIMESTAMP DEFAULT NOW(),
      status TEXT
    );
    CREATE TABLE IF NOT EXISTS disputas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      boleto_id UUID REFERENCES boletos(id),
      usuario_id UUID REFERENCES users(id),
      motivo TEXT,
      status TEXT,
      criado_em TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Tabelas verificadas/criadas com sucesso!');
}

initDb();

// Salvar/atualizar perfil do usuário
app.post('/perfil', async (req, res) => {
  console.log('Recebido no POST /perfil:', req.body);
  const { uid, nome_completo, email, telefone } = req.body;
  console.log('Preparando para salvar no banco:', { uid, nome_completo, email, telefone });
  try {
    await pool.query(`
      INSERT INTO users (firebase_uid, nome, email, telefone)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (firebase_uid) DO UPDATE SET nome = $2, email = $3, telefone = $4
    `, [uid, nome_completo, email, telefone]);
    console.log('Salvo no banco com sucesso!');
    res.send('Perfil salvo!');
  } catch (error) {
    console.error('Erro ao salvar no banco:', error);
    res.status(500).json({ error: 'Erro ao salvar no banco' });
  }
});

// Buscar perfil do usuário
app.get('/perfil/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [uid]);
    console.log('Perfil retornado do banco:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Criação da tabela de boletos (execute uma vez)
app.get('/criar-tabela-boletos', async (req, res) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS boletos (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(64),
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
  res.send('Tabela de boletos criada!');
});

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

// Rotas REST para boletos
app.use(express.json());

// Cadastrar boleto
app.post('/boletos', async (req, res) => {
  const { usuario_id, codigo_barras, cpf_cnpj, valor_brl, valor_usdt, cotacao_usdt, data_vencimento, instituicao, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO boletos (usuario_id, codigo_barras, cpf_cnpj, valor_brl, valor_usdt, cotacao_usdt, data_vencimento, instituicao, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [usuario_id, codigo_barras, cpf_cnpj, valor_brl, valor_usdt, cotacao_usdt, data_vencimento, instituicao, status || 'pendente']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar boletos por usuário
app.get('/boletos/usuario/:uid', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boletos WHERE usuario_id = $1 ORDER BY criado_em DESC', [req.params.uid]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar todos os boletos (gestão)
app.get('/boletos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boletos ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Histórico de boletos por usuário
app.get('/boletos/historico/:uid', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boletos WHERE usuario_id = $1 ORDER BY criado_em DESC', [req.params.uid]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Buscar boleto por id
app.get('/boletos/:id', async (req, res) => {
  const { id } = req.params;
  console.log('[BACKEND] GET /boletos/:id chamado com id:', id);
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'ID do boleto deve ser um número inteiro.' });
  }
  try {
    const result = await pool.query('SELECT * FROM boletos WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar boleto:', error);
    res.status(500).json({ error: 'Erro ao buscar boleto' });
  }
});

// Cancelar boleto (status = 'cancelado')
app.patch('/boletos/:id/cancelar', async (req, res) => {
  const { id } = req.params;
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'ID do boleto deve ser um número inteiro.' });
  }
  try {
    const result = await pool.query('UPDATE boletos SET status = $1 WHERE id = $2 RETURNING *', ['EXCLUIDO', id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao cancelar boleto:', error);
    res.status(500).json({ error: 'Erro ao cancelar boleto' });
  }
});

// Excluir boleto
app.delete('/boletos/:id', async (req, res) => {
  const { id } = req.params;
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'ID do boleto deve ser um número inteiro.' });
  }
  try {
    const result = await pool.query('DELETE FROM boletos WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir boleto:', error);
    res.status(500).json({ error: 'Erro ao excluir boleto' });
  }
});

// Atualizar status do boleto após confirmação on-chain
app.patch('/boletos/:id/atualizar-status', async (req, res) => {
  const { id } = req.params;
  const { status, txHash } = req.body;
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'ID do boleto deve ser um número inteiro.' });
  }
  try {
    const result = await pool.query(
      'UPDATE boletos SET status = $1, numero_controle = $2 WHERE id = $3 RETURNING *',
      [mapStatus(status), txHash, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status do boleto:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do boleto' });
  }
});

// Registrar disputa para um boleto
app.post('/boletos/:id/disputa', async (req, res) => {
  const { id } = req.params;
  const { motivo, usuario } = req.body;
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'ID do boleto deve ser um número inteiro.' });
  }
  try {
    // Cria tabela de disputas se não existir
    await pool.query(`CREATE TABLE IF NOT EXISTS disputas (
      id SERIAL PRIMARY KEY,
      boleto_id INTEGER,
      usuario VARCHAR(64),
      motivo TEXT,
      status VARCHAR(32) DEFAULT 'ABERTA',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    // Insere disputa
    const result = await pool.query(
      'INSERT INTO disputas (boleto_id, usuario, motivo) VALUES ($1, $2, $3) RETURNING *',
      [id, usuario, motivo]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar disputa:', error);
    res.status(500).json({ error: 'Erro ao registrar disputa' });
  }
});

// Consultar status da disputa
app.get('/boletos/:id/disputa', async (req, res) => {
  const { id } = req.params;
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'ID do boleto deve ser um número inteiro.' });
  }
  try {
    const result = await pool.query('SELECT * FROM disputas WHERE boleto_id = $1 ORDER BY criado_em DESC LIMIT 1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Nenhuma disputa encontrada para este boleto.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao consultar disputa:', error);
    res.status(500).json({ error: 'Erro ao consultar disputa' });
  }
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));