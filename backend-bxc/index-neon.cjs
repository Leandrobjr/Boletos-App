const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Testar conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar ao Neon:', err.message);
  } else {
    console.log('✅ Conectado ao Neon PostgreSQL com sucesso!');
  }
});

// Criação das tabelas se não existirem
async function initDb() {
  try {
    // Tabela users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        firebase_uid TEXT PRIMARY KEY,
        nome TEXT,
        email TEXT,
        telefone TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela boletos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boletos (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        cpf_cnpj TEXT,
        codigo_barras TEXT,
        valor REAL,
        valor_brl REAL,
        valor_usdt REAL,
        vencimento DATE,
        instituicao TEXT,
        status TEXT DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        numero_controle TEXT,
        comprovante_url TEXT,
        wallet_address TEXT,
        tx_hash TEXT
      )
    `);

    console.log('✅ Tabelas criadas/verificadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

initDb();

// Função para executar queries com Promise
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({ id: result.rows[0]?.id, changes: result.rowCount });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.rows[0]);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.rows);
      }
    });
  });
}

// Função utilitária para mapear status antigos para o novo padrão
function mapStatus(status) {
  switch ((status || '').toLowerCase()) {
    case 'pendente': return 'DISPONIVEL';
    case 'pago': return 'BAIXADO';
    case 'reservado': return 'AGUARDANDO PAGAMENTO';
    case 'aguardando_baixa': return 'AGUARDANDO BAIXA';
    case 'cancelado': return 'EXCLUIDO';
    default: return status ? status.toUpperCase() : status;
  }
}

// Rotas da API
app.get('/boletos', async (req, res) => {
  try {
    const boletos = await allQuery('SELECT * FROM boletos ORDER BY criado_em DESC');
    const boletosMapeados = boletos.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao listar boletos:', error);
    res.status(500).json({ error: 'Erro ao listar boletos' });
  }
});

app.get('/boletos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const boleto = await getQuery('SELECT * FROM boletos WHERE id = $1', [id]);
    if (!boleto) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    const boletoMapeado = {
      ...boleto,
      status: mapStatus(boleto.status)
    };
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao buscar boleto:', error);
    res.status(500).json({ error: 'Erro ao buscar boleto' });
  }
});

app.post('/boletos', async (req, res) => {
  const { user_id, cpf_cnpj, codigo_barras, valor_brl, vencimento, instituicao } = req.body;
  try {
    // Gerar número de controle único
    const result = await pool.query('SELECT COUNT(*) as count FROM boletos');
    const numeroControle = (result.rows[0].count + 1).toString().padStart(6, '0');
    
    const boleto = await getQuery(
      `INSERT INTO boletos (user_id, cpf_cnpj, codigo_barras, valor_brl, vencimento, instituicao, numero_controle)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, cpf_cnpj, codigo_barras, valor_brl, vencimento, instituicao, numeroControle]
    );
    
    const boletoMapeado = {
      ...boleto,
      status: mapStatus(boleto.status)
    };
    
    res.status(201).json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro ao criar boleto' });
  }
});

app.get('/boletos/usuario/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const boletos = await allQuery('SELECT * FROM boletos WHERE user_id = $1 ORDER BY criado_em DESC', [user_id]);
    const boletosMapeados = boletos.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao buscar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar boletos do usuário' });
  }
});

app.get('/boletos/comprados/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const boletos = await allQuery(
      'SELECT * FROM boletos WHERE user_id = $1 AND status IN ($2, $3) ORDER BY criado_em DESC',
      [user_id, 'pago', 'reservado']
    );
    const boletosMapeados = boletos.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao buscar boletos comprados:', error);
    res.status(500).json({ error: 'Erro ao buscar boletos comprados' });
  }
});

// Perfil do usuário
app.post('/perfil', async (req, res) => {
  const { firebase_uid, nome, email, telefone } = req.body;
  try {
    await runQuery(
      `INSERT INTO users (firebase_uid, nome, email, telefone)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (firebase_uid) 
       DO UPDATE SET nome = $2, email = $3, telefone = $4`,
      [firebase_uid, nome, email, telefone]
    );
    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

app.get('/perfil/:firebase_uid', async (req, res) => {
  const { firebase_uid } = req.params;
  try {
    const result = await getQuery('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
    res.json(result || {});
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend Neon PostgreSQL rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end();
  console.log('✅ Conexão Neon PostgreSQL fechada com sucesso');
  process.exit(0);
});