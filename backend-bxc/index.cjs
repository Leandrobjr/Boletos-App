const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do banco de dados com fallback
let pool;

try {
  // Tentar conectar ao Neon primeiro
  pool = new Pool({
    user: 'neondb_owner',
    host: 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech',
    database: 'neondb',
    password: 'npg_dPQtsIq53OVc',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });
  
  // Testar conexão
  pool.query('SELECT 1').then(() => {
    console.log('✅ Conectado ao banco Neon com sucesso!');
  }).catch((error) => {
    console.log('❌ Erro ao conectar ao Neon:', error.message);
    console.log('🔄 Tentando conectar ao banco local...');
    
    // Fallback para banco local
    pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'bxc_boletos',
      password: 'postgres',
      port: 5432
    });
    
    pool.query('SELECT 1').then(() => {
      console.log('✅ Conectado ao banco local com sucesso!');
    }).catch((localError) => {
      console.log('❌ Erro ao conectar ao banco local:', localError.message);
      console.log('💡 Para usar banco local, instale PostgreSQL e crie o banco "bxc_boletos"');
    });
  });
} catch (error) {
  console.log('❌ Erro na configuração do banco:', error.message);
}

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
      valor_brl NUMERIC(12,2),
      valor_usdt NUMERIC(12,2),
      vencimento DATE,
      instituicao VARCHAR(64),
      status VARCHAR(32) DEFAULT 'pendente',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      numero_controle VARCHAR(16),
      comprovante_url TEXT,
      wallet_address VARCHAR(42),
      tx_hash VARCHAR(66)
    );
  `);
  
  // Adicionar campos se não existirem (para tabelas já criadas)
  try {
    await pool.query('ALTER TABLE boletos ADD COLUMN IF NOT EXISTS valor_brl NUMERIC(12,2)');
    await pool.query('ALTER TABLE boletos ADD COLUMN IF NOT EXISTS valor_usdt NUMERIC(12,2)');
    await pool.query('ALTER TABLE boletos ADD COLUMN IF NOT EXISTS comprovante_url TEXT');
    await pool.query('ALTER TABLE boletos ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42)');
    await pool.query('ALTER TABLE boletos ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(66)');
  } catch (error) {
    console.log('Campos já existem ou erro ao adicionar:', error.message);
  }
  
  console.log('Tabelas verificadas/criadas com sucesso!');
}
initDb();

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
  
  console.log('DEBUG BACKEND - Dados extraídos:', {
    user_id,
    cpfCnpj,
    codigoBarras,
    valor_brl,
    valor_usdt,
    valorUsdt,
    vencimento,
    instituicao,
    status,
    numeroControle
  });
  
  let vencimentoFormatado = null;
  if (vencimento) {
    const d = new Date(vencimento);
    if (!isNaN(d.getTime())) {
      vencimentoFormatado = d.toISOString().split('T')[0];
    } else {
      console.log('DEBUG BACKEND - Data de vencimento inválida:', vencimento);
      return res.status(400).json({ error: 'Data de vencimento inválida. Use o formato YYYY-MM-DD.' });
    }
  } else {
    console.log('DEBUG BACKEND - Data de vencimento obrigatória');
    return res.status(400).json({ error: 'Data de vencimento obrigatória.' });
  }
  
  // Salvar valor_usdt exatamente como informado
  const valorUSDTFinal = valor_usdt || valorUsdt;
  
  console.log('DEBUG BACKEND - Dados finais para inserção:', {
    user_id,
    cpfCnpj,
    codigoBarras,
    valor_brl,
    valorUSDTFinal,
    vencimentoFormatado,
    instituicao,
    statusMapeado: mapStatus(status || 'pendente'),
    numeroControle
  });
  
  try {
    const result = await pool.query(
      `INSERT INTO boletos (user_id, cpf_cnpj, codigo_barras, valor_brl, valor_usdt, vencimento, instituicao, status, numero_controle)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [user_id, cpfCnpj, codigoBarras, valor_brl, valorUSDTFinal, vencimentoFormatado, instituicao, mapStatus(status || 'pendente'), numeroControle]
    );
    
    console.log('DEBUG BACKEND - Boleto criado com sucesso:', result.rows[0]);
    
    // Aplicar mapeamento de status no resultado
    const boletoMapeado = {
      ...result.rows[0],
      status: mapStatus(result.rows[0].status)
    };
    
    console.log('DEBUG BACKEND - Boleto mapeado para resposta:', boletoMapeado);
    res.json(boletoMapeado);
  } catch (error) {
    console.error('[BACKEND] Erro ao criar boleto:', error);
    console.error('[BACKEND] Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro ao criar boleto', detalhe: error.message });
  }
});

// Listar todos os boletos
app.get('/boletos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boletos ORDER BY criado_em DESC');
    // Aplicar mapeamento de status nos dados retornados
    const boletosMapeados = result.rows.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    res.json(boletosMapeados);
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
    // Aplicar mapeamento de status nos dados retornados
    const boletosMapeados = result.rows.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao listar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar boletos do usuário' });
  }
});

// Listar boletos comprados pelo usuário (para o portal do comprador)
app.get('/boletos/comprados/:uid', async (req, res) => {
  const { uid } = req.params;
  console.log('DEBUG: Buscando boletos comprados para usuário:', uid);
  try {
    const sql = `SELECT * FROM boletos 
                 WHERE user_id = $1 
                 AND status NOT IN ('pendente', 'disponivel', 'DISPONIVEL') 
                 ORDER BY criado_em DESC`;
    const result = await pool.query(sql, [uid]);
    console.log('DEBUG: Boletos encontrados (raw):', result.rows.map(b => ({
      id: b.id,
      numero_controle: b.numero_controle,
      status: b.status,
      comprovante_url: b.comprovante_url ? b.comprovante_url.substring(0, 50) + '...' : 'null'
    })));
    // Aplicar mapeamento de status nos dados retornados
    const boletosMapeados = result.rows.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    console.log('DEBUG: Boletos mapeados:', boletosMapeados.map(b => ({
      id: b.id,
      numero_controle: b.numero_controle,
      status: b.status,
      comprovante_url: b.comprovante_url ? b.comprovante_url.substring(0, 50) + '...' : 'null'
    })));
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao listar boletos comprados:', error);
    res.status(500).json({ error: 'Erro ao listar boletos comprados' });
  }
});

// Atualizar status do boleto para 'reservado' (reserva pelo comprador)
app.patch('/boletos/:numero_controle/reservar', async (req, res) => {
  const { numero_controle } = req.params;
  const { user_id, wallet_address } = req.body; // ID e endereço da carteira do comprador
  console.log('DEBUG: Reservando boleto:', { numero_controle, user_id, wallet_address });
  try {
    const result = await pool.query(
      `UPDATE boletos SET status = 'reservado', user_id = $2, wallet_address = $3 WHERE numero_controle = $1 RETURNING *`,
      [numero_controle, user_id, wallet_address]
    );
    console.log('DEBUG: Resultado da reserva:', result.rows[0]);
    if (result.rowCount === 0) {
      console.log('DEBUG: Boleto não encontrado para reserva');
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    // Aplicar mapeamento de status no resultado
    const boletoMapeado = {
      ...result.rows[0],
      status: mapStatus(result.rows[0].status)
    };
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao reservar boleto:', error);
    res.status(500).json({ error: 'Erro ao reservar boleto' });
  }
});

// Enviar comprovante e atualizar status do boleto
app.patch('/boletos/:numero_controle/comprovante', async (req, res) => {
  const { numero_controle } = req.params;
  const { comprovante_url, filename, filesize, filetype } = req.body;
  console.log('DEBUG: Enviando comprovante:', { 
    numero_controle, 
    comprovante_url: comprovante_url ? comprovante_url.substring(0, 50) + '...' : 'null',
    filename, 
    filesize, 
    filetype 
  });
  try {
    const result = await pool.query(
      `UPDATE boletos SET status = 'aguardando_baixa', comprovante_url = $2 WHERE numero_controle = $1 RETURNING *`,
      [numero_controle, comprovante_url]
    );
    console.log('DEBUG: Resultado do envio de comprovante:', {
      id: result.rows[0]?.id,
      numero_controle: result.rows[0]?.numero_controle,
      status: result.rows[0]?.status,
      comprovante_url: result.rows[0]?.comprovante_url ? result.rows[0].comprovante_url.substring(0, 50) + '...' : 'null'
    });
    if (result.rowCount === 0) {
      console.log('DEBUG: Boleto não encontrado para envio de comprovante');
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    // Aplicar mapeamento de status no resultado
    const boletoMapeado = {
      ...result.rows[0],
      status: mapStatus(result.rows[0].status)
    };
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao enviar comprovante:', error);
    res.status(500).json({ error: 'Erro ao enviar comprovante' });
  }
});

// Limpar URLs de exemplo do banco (rota temporária para correção)
app.patch('/boletos/limpar-exemplos', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE boletos SET comprovante_url = NULL WHERE comprovante_url LIKE '%exemplo.com%' RETURNING id, numero_controle, comprovante_url`
    );
    console.log('DEBUG: URLs de exemplo removidas:', result.rows);
    res.json({ 
      message: 'URLs de exemplo removidas com sucesso',
      boletosAtualizados: result.rows.length,
      detalhes: result.rows
    });
  } catch (error) {
    console.error('Erro ao limpar URLs de exemplo:', error);
    res.status(500).json({ error: 'Erro ao limpar URLs de exemplo' });
  }
});

// Cancelar boleto (mudar status para EXCLUIDO)
app.patch('/boletos/:id/cancelar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE boletos SET status = 'cancelado' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    // Aplicar mapeamento de status no resultado
    const boletoMapeado = {
      ...result.rows[0],
      status: mapStatus(result.rows[0].status)
    };
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao cancelar boleto:', error);
    res.status(500).json({ error: 'Erro ao cancelar boleto' });
  }
});

// Excluir boleto (remoção física)
app.delete('/boletos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM boletos WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    res.json({ message: 'Boleto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir boleto:', error);
    res.status(500).json({ error: 'Erro ao excluir boleto' });
  }
});

// Baixar boleto (mudar status para BAIXADO)
app.patch('/boletos/:numero_controle/baixar', async (req, res) => {
  const { numero_controle } = req.params;
  const { user_id, wallet_address_vendedor, wallet_address_comprador, tx_hash } = req.body;
  try {
    const result = await pool.query(
      `UPDATE boletos SET status = 'pago', tx_hash = $2 WHERE numero_controle = $1 RETURNING *`,
      [numero_controle, tx_hash]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    // Aplicar mapeamento de status no resultado
    const boletoMapeado = {
      ...result.rows[0],
      status: mapStatus(result.rows[0].status)
    };
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao baixar boleto:', error);
    res.status(500).json({ error: 'Erro ao baixar boleto' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});