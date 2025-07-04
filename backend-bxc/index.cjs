const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

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

// Crie a tabela de usuários (execute uma vez)
app.get('/criar-tabela', async (req, res) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      uid VARCHAR(64) PRIMARY KEY,
      nome_completo VARCHAR(255),
      email VARCHAR(255),
      telefone VARCHAR(30),
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  res.send('Tabela criada!');
});

// Salvar/atualizar perfil do usuário
app.post('/perfil', async (req, res) => {
  console.log('Recebido no POST /perfil:', req.body);
  const { uid, nome_completo, email, telefone } = req.body;
  console.log('Preparando para salvar no banco:', { uid, nome_completo, email, telefone });
  try {
    await pool.query(`
      INSERT INTO usuarios (uid, nome_completo, email, telefone)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (uid) DO UPDATE SET nome_completo = $2, email = $3, telefone = $4
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
    const result = await pool.query('SELECT * FROM usuarios WHERE uid = $1', [uid]);
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

// Criar novo boleto
app.post('/boletos', async (req, res) => {
  console.log('[BACKEND] Recebido POST /boletos:', req.body);
  console.log('[BACKEND] UID recebido no cadastro:', req.body.uid);
  const { uid, cpfCnpj, codigoBarras, valor, vencimento, instituicao, status, numeroControle } = req.body;
  // Validação e formatação do vencimento
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
      `INSERT INTO boletos (uid, cpf_cnpj, codigo_barras, valor, vencimento, instituicao, status, numero_controle)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [uid, cpfCnpj, codigoBarras, valor, vencimentoFormatado, instituicao, mapStatus(status || 'pendente'), numeroControle]
    );
    console.log('[BACKEND] Boleto inserido:', result.rows[0]);
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
  console.log('[BACKEND] GET /boletos/usuario/:uid consultando UID:', uid);
  try {
    const sql = 'SELECT * FROM boletos WHERE uid = $1 ORDER BY criado_em DESC';
    console.log('[BACKEND] SQL executado:', sql, '| Param:', uid);
    const result = await pool.query(sql, [uid]);
    console.log('[BACKEND] Resultado da busca (bruto):', result.rows);
    // Garante vencimento como string ISO (YYYY-MM-DD)
    const boletos = result.rows.map(boleto => ({
      ...boleto,
      vencimento: boleto.vencimento ? new Date(boleto.vencimento).toISOString().split('T')[0] : null,
      status: mapStatus(boleto.status)
    }));
    console.log('[BACKEND] Resultado da busca:', boletos);
    res.json(boletos);
  } catch (error) {
    console.error('Erro ao listar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar boletos do usuário' });
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

app.listen(3001, () => console.log('Backend rodando na porta 3001'));