const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do SQLite
const dbPath = path.join(__dirname, 'bxc_boletos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao SQLite:', err.message);
  } else {
    console.log('✅ Conectado ao banco SQLite com sucesso!');
    console.log('📁 Arquivo do banco:', dbPath);
  }
});

// Criação das tabelas se não existirem
function initDb() {
  db.serialize(() => {
    // Tabela users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      firebase_uid TEXT PRIMARY KEY,
      nome TEXT,
      email TEXT,
      telefone TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela boletos
    db.run(`CREATE TABLE IF NOT EXISTS boletos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      cpf_cnpj TEXT,
      codigo_barras TEXT,
      valor REAL,
      valor_brl REAL,
      valor_usdt REAL,
      vencimento DATE,
      instituicao TEXT,
      status TEXT DEFAULT 'pendente',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      numero_controle TEXT,
      comprovante_url TEXT,
      wallet_address TEXT,
      tx_hash TEXT
    )`);

    console.log('✅ Tabelas criadas/verificadas com sucesso!');
  });
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

// Função para executar queries com Promise
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Salvar/atualizar perfil do usuário
app.post('/perfil', async (req, res) => {
  console.log('Recebido no POST /perfil:', req.body);
  const { firebase_uid, nome, email, telefone } = req.body;
  try {
    await runQuery(
      `INSERT OR REPLACE INTO users (firebase_uid, nome, email, telefone)
       VALUES (?, ?, ?, ?)`,
      [firebase_uid, nome, email, telefone]
    );
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
    const result = await getQuery('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);
    res.json(result);
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
    user_id, cpfCnpj, codigoBarras, valor_brl, valor_usdt, valorUsdt, vencimento, instituicao, status, numeroControle
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
  
  const valorUSDTFinal = valor_usdt || valorUsdt;
  
  console.log('DEBUG BACKEND - Dados finais para inserção:', {
    user_id, cpfCnpj, codigoBarras, valor_brl, valorUSDTFinal, vencimentoFormatado, instituicao,
    statusMapeado: mapStatus(status || 'pendente'), numeroControle
  });
  
  try {
    const result = await runQuery(
      `INSERT INTO boletos (user_id, cpf_cnpj, codigo_barras, valor_brl, valor_usdt, vencimento, instituicao, status, numero_controle)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, cpfCnpj, codigoBarras, valor_brl, valorUSDTFinal, vencimentoFormatado, instituicao, mapStatus(status || 'pendente'), numeroControle]
    );
    
    const boletoCriado = await getQuery('SELECT * FROM boletos WHERE id = ?', [result.id]);
    console.log('DEBUG BACKEND - Boleto criado com sucesso:', boletoCriado);
    
    const boletoMapeado = {
      ...boletoCriado,
      status: mapStatus(boletoCriado.status)
    };
    
    console.log('DEBUG BACKEND - Boleto mapeado para resposta:', boletoMapeado);
    res.json(boletoMapeado);
  } catch (error) {
    console.error('[BACKEND] Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro ao criar boleto', detalhe: error.message });
  }
});

// Listar todos os boletos
app.get('/boletos', async (req, res) => {
  try {
    const result = await allQuery('SELECT * FROM boletos ORDER BY criado_em DESC');
    const boletosMapeados = result.map(boleto => ({
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
    const result = await allQuery('SELECT * FROM boletos WHERE user_id = ? ORDER BY criado_em DESC', [uid]);
    const boletosMapeados = result.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao listar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar boletos do usuário' });
  }
});

// Listar boletos comprados pelo usuário
app.get('/boletos/comprados/:uid', async (req, res) => {
  const { uid } = req.params;
  console.log('DEBUG: Buscando boletos comprados para usuário:', uid);
  try {
    const result = await allQuery(
      `SELECT * FROM boletos 
       WHERE user_id = ? 
       AND status NOT IN ('pendente', 'disponivel', 'DISPONIVEL') 
       ORDER BY criado_em DESC`,
      [uid]
    );
    
    console.log('DEBUG: Boletos encontrados (raw):', result.map(b => ({
      id: b.id,
      numero_controle: b.numero_controle,
      status: b.status,
      comprovante_url: b.comprovante_url ? b.comprovante_url.substring(0, 50) + '...' : 'null'
    })));
    
    const boletosMapeados = result.map(boleto => ({
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

// Atualizar status do boleto para 'reservado'
app.patch('/boletos/:numero_controle/reservar', async (req, res) => {
  const { numero_controle } = req.params;
  const { user_id, wallet_address } = req.body;
  console.log('DEBUG: Reservando boleto:', { numero_controle, user_id, wallet_address });
  try {
    const result = await runQuery(
      `UPDATE boletos SET status = 'reservado', user_id = ?, wallet_address = ? WHERE numero_controle = ?`,
      [user_id, wallet_address, numero_controle]
    );
    
    if (result.changes === 0) {
      console.log('DEBUG: Boleto não encontrado para reserva');
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    const boletoAtualizado = await getQuery('SELECT * FROM boletos WHERE numero_controle = ?', [numero_controle]);
    const boletoMapeado = {
      ...boletoAtualizado,
      status: mapStatus(boletoAtualizado.status)
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
    filename, filesize, filetype 
  });
  
  try {
    const result = await runQuery(
      `UPDATE boletos SET status = 'aguardando_baixa', comprovante_url = ? WHERE numero_controle = ?`,
      [comprovante_url, numero_controle]
    );
    
    if (result.changes === 0) {
      console.log('DEBUG: Boleto não encontrado para envio de comprovante');
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    const boletoAtualizado = await getQuery('SELECT * FROM boletos WHERE numero_controle = ?', [numero_controle]);
    const boletoMapeado = {
      ...boletoAtualizado,
      status: mapStatus(boletoAtualizado.status)
    };
    
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao enviar comprovante:', error);
    res.status(500).json({ error: 'Erro ao enviar comprovante' });
  }
});

// Limpar URLs de exemplo
app.patch('/boletos/limpar-exemplos', async (req, res) => {
  try {
    const result = await runQuery(
      `UPDATE boletos SET comprovante_url = NULL WHERE comprovante_url LIKE '%exemplo.com%'`
    );
    
    const boletosAtualizados = await allQuery(
      `SELECT id, numero_controle, comprovante_url FROM boletos WHERE comprovante_url LIKE '%exemplo.com%'`
    );
    
    console.log('DEBUG: URLs de exemplo removidas:', boletosAtualizados);
    res.json({ 
      message: 'URLs de exemplo removidas com sucesso',
      boletosAtualizados: result.changes,
      detalhes: boletosAtualizados
    });
  } catch (error) {
    console.error('Erro ao limpar URLs de exemplo:', error);
    res.status(500).json({ error: 'Erro ao limpar URLs de exemplo' });
  }
});

// Cancelar boleto
app.patch('/boletos/:id/cancelar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await runQuery(
      `UPDATE boletos SET status = 'cancelado' WHERE id = ?`,
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    const boletoAtualizado = await getQuery('SELECT * FROM boletos WHERE id = ?', [id]);
    const boletoMapeado = {
      ...boletoAtualizado,
      status: mapStatus(boletoAtualizado.status)
    };
    
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao cancelar boleto:', error);
    res.status(500).json({ error: 'Erro ao cancelar boleto' });
  }
});

// Excluir boleto
app.delete('/boletos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await runQuery(
      `DELETE FROM boletos WHERE id = ?`,
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    res.json({ message: 'Boleto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir boleto:', error);
    res.status(500).json({ error: 'Erro ao excluir boleto' });
  }
});

// Baixar boleto
app.patch('/boletos/:numero_controle/baixar', async (req, res) => {
  const { numero_controle } = req.params;
  const { user_id, wallet_address_vendedor, wallet_address_comprador, tx_hash } = req.body;
  try {
    const result = await runQuery(
      `UPDATE boletos SET status = 'pago', tx_hash = ? WHERE numero_controle = ?`,
      [tx_hash, numero_controle]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    const boletoAtualizado = await getQuery('SELECT * FROM boletos WHERE numero_controle = ?', [numero_controle]);
    const boletoMapeado = {
      ...boletoAtualizado,
      status: mapStatus(boletoAtualizado.status)
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
  console.log(`🚀 Servidor backend SQLite rodando na porta ${PORT}`);
  console.log(`📊 Banco de dados: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar banco:', err.message);
    } else {
      console.log('✅ Banco SQLite fechado com sucesso');
    }
    process.exit(0);
  });
}); 