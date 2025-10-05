const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

console.log('🚀 DEBUG: Iniciando backend -', new Date().toISOString());
console.log('🔍 DEBUG: NODE_ENV =', process.env.NODE_ENV);
console.log('🔍 DEBUG: PORT =', process.env.PORT);
console.log('🔍 DEBUG: PWD =', process.cwd());
console.log('🔍 DEBUG: Arquivos no diretório:', require('fs').readdirSync('.'));

const app = express();

// Configuração CORS robusta
const corsOptions = {
  origin: [
    'https://boletos-app-mocha.vercel.app',
    'https://boletos-app.vercel.app',
    'https://bxc-boletos-app.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware para headers adicionais
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Verificar se as variáveis de ambiente estão configuradas
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

console.log('🔍 DB_HOST:', dbHost);
console.log('🔍 DB_USER:', dbUser);
console.log('🔍 DB_PASS configurado:', dbPass ? 'Sim' : 'Não');
console.log('🔍 DB_NAME:', dbName);

// Configuração do Neon PostgreSQL
let pool;
try {
  // Construir string de conexão a partir de variáveis separadas
  const connectionString = `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`;
  
  console.log('🔍 String de conexão construída:', connectionString);
  
  pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });
  // Aplicar timeouts no nível da sessão para evitar travamentos em consultas longas
  pool.on('connect', (client) => {
    client.query("SET statement_timeout = '8000ms'").catch(() => {});
    client.query("SET idle_in_transaction_session_timeout = '8000ms'").catch(() => {});
  });
  console.log('✅ Pool de conexão criado com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar pool de conexão:', error);
  process.exit(1);
}

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

// Inicializar banco de forma assíncrona
initDb().catch(error => {
  console.error('❌ Erro na inicialização do banco:', error);
});

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

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend BXC funcionando!', 
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
  });
});

// Rotas da API
app.get('/boletos', async (req, res) => {
  try {
    console.log('🔍 Buscando todos os boletos...');
    const boletos = await allQuery('SELECT * FROM boletos ORDER BY criado_em DESC');
    console.log(`✅ ${boletos.length} boletos encontrados`);
    
    const boletosMapeados = boletos.map(boleto => {
      console.log('📊 Boleto original:', {
        id: boleto.id,
        numero_controle: boleto.numero_controle,
        valor_brl: boleto.valor_brl,
        valor_usdt: boleto.valor_usdt,
        vencimento: boleto.vencimento,
        status: boleto.status
      });
      
      return {
      ...boleto,
      status: mapStatus(boleto.status)
      };
    });
    
    console.log('🎯 Boletos mapeados enviados para o frontend');
    res.json(boletosMapeados);
  } catch (error) {
    console.error('❌ Erro ao listar boletos:', error);
    res.status(500).json({ error: 'Erro ao listar boletos', details: error.message });
  }
});

app.get('/boletos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Garantir ID inteiro para evitar erros de casting no Postgres
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || Math.abs(numericId) > 2147483647) {
      return res.status(400).json({ error: 'ID inválido. Use /boletos/controle/:numero_controle para buscar por número de controle.' });
    }

    const boleto = await getQuery('SELECT * FROM boletos WHERE id = $1', [numericId]);
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
    res.status(500).json({ error: 'Erro ao buscar boleto', details: error.message });
  }
});

// Utilitário: obter boleto por id (numérico) ou numero_controle (string)
async function getBoletoByAnyId(idOrControl) {
  if (idOrControl == null) return null;
  const asString = String(idOrControl);
  const asNumber = Number(idOrControl);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Caso 1: ID inteiro (SERIAL)
  if (Number.isInteger(asNumber) && Math.abs(asNumber) <= 2147483647) {
    return await getQuery('SELECT * FROM boletos WHERE id = $1', [asNumber]);
  }

  // Caso 2: UUID (id UUID em alguns ambientes) → comparar como texto
  if (uuidRegex.test(asString)) {
    const byUuid = await getQuery('SELECT * FROM boletos WHERE id::text = $1', [asString]);
    if (byUuid) return byUuid;
  }

  // Caso 3: numero_controle (string/num longo)
  return await getQuery('SELECT * FROM boletos WHERE numero_controle = $1 OR CAST(numero_controle AS TEXT) = $1', [asString]);
}

// PATCH reservar boleto (por id interno ou numero_controle)
app.patch('/boletos/:id/reservar', async (req, res) => {
  try {
    const idParam = req.params.id;
    const { user_id, wallet_address, tx_hash } = req.body || {};
    if (!user_id || !wallet_address) {
      return res.status(400).json({ error: 'user_id e wallet_address são obrigatórios' });
    }

    const boleto = await getBoletoByAnyId(idParam);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });
    const normalized = (mapStatus(boleto.status) || '').toUpperCase();
    if (normalized !== 'DISPONIVEL') {
      return res.status(400).json({ error: 'Boleto não disponível', status: boleto.status });
    }

    const updated = await getQuery(
      'UPDATE boletos SET status = $1, wallet_address = $2, tx_hash = $3 WHERE id = $4 RETURNING *',
      ['AGUARDANDO PAGAMENTO', wallet_address, tx_hash || null, boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro reservar boleto:', e);
    res.status(500).json({ error: 'Erro ao reservar boleto', details: e.message });
  }
});

// Rotas explícitas por numero_controle
app.patch('/boletos/controle/:numero_controle/reservar', async (req, res) => {
  try {
    const numeroControle = String(req.params.numero_controle);
    const { user_id, wallet_address, tx_hash } = req.body || {};
    if (!user_id || !wallet_address) return res.status(400).json({ error: 'user_id e wallet_address são obrigatórios' });
    const boleto = await getQuery('SELECT * FROM boletos WHERE numero_controle = $1', [numeroControle]);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });
    const normalized = (mapStatus(boleto.status) || '').toUpperCase();
    if (normalized !== 'DISPONIVEL') return res.status(400).json({ error: 'Boleto não disponível', status: boleto.status });
    const updated = await getQuery(
      'UPDATE boletos SET status = $1, wallet_address = $2, tx_hash = $3 WHERE id = $4 RETURNING *',
      ['AGUARDANDO PAGAMENTO', wallet_address, tx_hash || null, boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro reservar por numero_controle:', e);
    res.status(500).json({ error: 'Erro ao reservar boleto', details: e.message });
  }
});

app.patch('/boletos/controle/:numero_controle/liberar', async (req, res) => {
  try {
    const numeroControle = String(req.params.numero_controle);
    const boleto = await getQuery('SELECT * FROM boletos WHERE numero_controle = $1', [numeroControle]);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });
    const updated = await getQuery(
      'UPDATE boletos SET status = $1, wallet_address = NULL, tx_hash = NULL WHERE id = $2 RETURNING *',
      ['DISPONIVEL', boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro liberar por numero_controle:', e);
    res.status(500).json({ error: 'Erro ao liberar boleto', details: e.message });
  }
});

app.patch('/boletos/controle/:numero_controle/comprovante', async (req, res) => {
  try {
    const numeroControle = String(req.params.numero_controle);
    const { comprovante_url } = req.body || {};
    if (!comprovante_url) return res.status(400).json({ error: 'comprovante_url é obrigatório' });
    const boleto = await getQuery('SELECT * FROM boletos WHERE numero_controle = $1', [numeroControle]);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });
    const updated = await getQuery(
      'UPDATE boletos SET comprovante_url = $1, status = $2 WHERE id = $3 RETURNING *',
      [comprovante_url, 'AGUARDANDO BAIXA', boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro comprovante por numero_controle:', e);
    res.status(500).json({ error: 'Erro ao salvar comprovante', details: e.message });
  }
});

// PATCH baixar boleto (por id interno ou numero_controle)
app.patch('/boletos/:id/baixar', async (req, res) => {
  try {
    const idParam = req.params.id;
    const boleto = await getBoletoByAnyId(idParam);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });

    // Opcional: aceitar tx_hash no corpo
    const { tx_hash } = req.body || {};

    const updated = await getQuery(
      'UPDATE boletos SET status = $1, tx_hash = COALESCE($2, tx_hash) WHERE id = $3 RETURNING *',
      ['BAIXADO', tx_hash || null, boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro baixar boleto:', e);
    res.status(500).json({ error: 'Erro ao baixar boleto', details: e.message });
  }
});

// PATCH baixar boleto por numero_controle
app.patch('/boletos/controle/:numero_controle/baixar', async (req, res) => {
  try {
    const numeroControle = String(req.params.numero_controle);
    const boleto = await getQuery('SELECT * FROM boletos WHERE numero_controle = $1', [numeroControle]);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });

    const { tx_hash } = req.body || {};

    const updated = await getQuery(
      'UPDATE boletos SET status = $1, tx_hash = COALESCE($2, tx_hash) WHERE id = $3 RETURNING *',
      ['BAIXADO', tx_hash || null, boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro baixar por numero_controle:', e);
    res.status(500).json({ error: 'Erro ao baixar boleto', details: e.message });
  }
});
// PATCH liberar boleto (por id interno ou numero_controle)
app.patch('/boletos/:id/liberar', async (req, res) => {
  try {
    const idParam = req.params.id;
    const boleto = await getBoletoByAnyId(idParam);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });

    const updated = await getQuery(
      'UPDATE boletos SET status = $1, wallet_address = NULL, tx_hash = NULL WHERE id = $2 RETURNING *',
      ['DISPONIVEL', boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro liberar boleto:', e);
    res.status(500).json({ error: 'Erro ao liberar boleto', details: e.message });
  }
});

// PATCH enviar comprovante (por id interno ou numero_controle)
app.patch('/boletos/:id/comprovante', async (req, res) => {
  try {
    const idParam = req.params.id;
    const { comprovante_url } = req.body || {};
    if (!comprovante_url) return res.status(400).json({ error: 'comprovante_url é obrigatório' });
    const boleto = await getBoletoByAnyId(idParam);
    if (!boleto) return res.status(404).json({ error: 'Boleto não encontrado' });

    const updated = await getQuery(
      'UPDATE boletos SET comprovante_url = $1, status = $2 WHERE id = $3 RETURNING *',
      [comprovante_url, 'AGUARDANDO BAIXA', boleto.id]
    );
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro salvar comprovante:', e);
    res.status(500).json({ error: 'Erro ao salvar comprovante', details: e.message });
  }
});
// Busca por número de controle (texto/longo)
app.get('/boletos/controle/:numero_controle', async (req, res) => {
  const { numero_controle } = req.params;
  try {
    const boleto = await getQuery('SELECT * FROM boletos WHERE numero_controle = $1', [String(numero_controle)]);
    if (!boleto) {
      return res.status(404).json({ error: 'Boleto não encontrado (numero_controle)' });
    }
    const boletoMapeado = {
      ...boleto,
      status: mapStatus(boleto.status)
    };
    res.json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao buscar boleto por numero_controle:', error);
    res.status(500).json({ error: 'Erro ao buscar boleto por numero_controle', details: error.message });
  }
});

// Stream seguro do comprovante em PDF para permitir embed no navegador
app.get('/boletos/:id/comprovante', async (req, res) => {
  const { id } = req.params;
  try {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || Math.abs(numericId) > 2147483647) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const row = await getQuery('SELECT comprovante_url FROM boletos WHERE id = $1', [numericId]);
    if (!row || !row.comprovante_url) return res.status(404).json({ error: 'Comprovante não encontrado' });
    await streamComprovanteFromSource(row.comprovante_url, res, `comprovante-${numericId}.pdf`);
  } catch (error) {
    console.error('Erro ao streamar comprovante por id:', error);
    res.status(500).json({ error: 'Erro ao obter comprovante', details: error.message });
  }
});

app.get('/boletos/controle/:numero_controle/comprovante', async (req, res) => {
  const { numero_controle } = req.params;
  try {
    const row = await getQuery('SELECT comprovante_url FROM boletos WHERE numero_controle = $1', [String(numero_controle)]);
    if (!row || !row.comprovante_url) return res.status(404).json({ error: 'Comprovante não encontrado' });
    await streamComprovanteFromSource(row.comprovante_url, res, `comprovante-${String(numero_controle)}.pdf`);
  } catch (error) {
    console.error('Erro ao streamar comprovante por numero_controle:', error);
    res.status(500).json({ error: 'Erro ao obter comprovante', details: error.message });
  }
});

/**
 * Faz stream do comprovante para o cliente, normalizando headers para permitir embed
 */
async function streamComprovanteFromSource(sourceUrl, res, filenameHint) {
  try {
    // Headers de segurança e embed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000 http://localhost:5173 http://127.0.0.1:5173 https://boletos-app-mocha.vercel.app https://bxc-boletos-app.vercel.app");
    res.setHeader('Cache-Control', 'private, max-age=600');

    if (typeof sourceUrl === 'string' && sourceUrl.startsWith('data:application/pdf')) {
      // data: URL → converter para Buffer e devolver como PDF
      const base64 = sourceUrl.split(',')[1] || '';
      const buffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filenameHint || 'comprovante'}.pdf"`);
      res.end(buffer);
      return;
    }

    // Se for imagem (PNG/JPEG) apenas repassar como imagem (iframe não exibe imagem; usado para download)
    if (typeof sourceUrl === 'string' && sourceUrl.startsWith('data:image/')) {
      const [meta, data] = sourceUrl.split(',');
      const mime = meta.split(';')[0].replace('data:', '') || 'image/png';
      const buffer = Buffer.from(data || '', 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `inline; filename="${filenameHint || 'comprovante'}.${mime.includes('jpeg') ? 'jpg' : 'png'}"`);
      res.end(buffer);
      return;
    }

    // http(s) → baixar do upstream e streamar
    const upstream = await fetch(sourceUrl);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Falha ao baixar fonte do comprovante (${upstream.status})` });
      return;
    }
    const contentType = upstream.headers.get('content-type') || 'application/pdf';
    const len = upstream.headers.get('content-length');
    res.setHeader('Content-Type', contentType.startsWith('application/pdf') ? contentType : 'application/pdf');
    if (len) res.setHeader('Content-Length', len);
    res.setHeader('Content-Disposition', `inline; filename="${filenameHint || 'comprovante'}.pdf"`);

    const readable = upstream.body;
    readable.pipe(res);
    readable.on('error', (err) => {
      console.error('Erro no stream do comprovante:', err);
      if (!res.headersSent) res.status(500).end('Erro no stream');
    });
  } catch (error) {
    console.error('Erro geral no streamComprovanteFromSource:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Erro interno ao processar comprovante' });
  }
}

// Proxy simples para Coingecko (evita CORS no frontend)
app.get('/api/proxy/coingecko', async (req, res) => {
  try {
    const ticker = req.query.ticker || 'tether';
    const vs = req.query.vs || 'brl';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ticker)}&vs_currencies=${encodeURIComponent(vs)}`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) {
      return res.status(r.status).json({ error: `Falha Coingecko ${r.status}` });
    }
    const data = await r.json();
    const price = data?.[ticker]?.[vs];
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ price });
  } catch (e) {
    res.status(500).json({ error: 'Proxy Coingecko falhou', details: e.message });
  }
});

// Proxy para comprovantes - serve diretamente o arquivo para nova aba
app.get('/api/proxy/comprovante/:id', async (req, res) => {
  try {
    console.log('🔍 Proxy comprovante solicitado para ID:', req.params.id);
    
    const { id } = req.params;
    const boleto = await getBoletoByAnyId(id);
    
    if (!boleto) {
      console.log('❌ Boleto não encontrado para ID:', id);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Comprovante não encontrado</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🔍 Comprovante não encontrado</h1>
          <p>O boleto solicitado não foi localizado.</p>
          <button onclick="window.close()">Fechar</button>
        </body>
        </html>
      `);
    }
    
    if (!boleto.comprovante_url) {
      console.log('❌ Boleto sem comprovante:', id);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Comprovante não disponível</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>📄 Comprovante não disponível</h1>
          <p>Este boleto ainda não possui comprovante de pagamento.</p>
          <button onclick="window.close()">Fechar</button>
        </body>
        </html>
      `);
    }
    
    console.log('✅ Servindo comprovante via proxy:', boleto.comprovante_url.substring(0, 100) + '...');
    
    // Usar a função existente para stream do comprovante
    await streamComprovanteFromSource(
      boleto.comprovante_url, 
      res, 
      `comprovante-${boleto.numero_controle || boleto.id}.pdf`
    );
    
  } catch (error) {
    console.error('❌ Erro no proxy de comprovante:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro no comprovante</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>⚠️ Erro ao carregar comprovante</h1>
        <p>Ocorreu um erro interno. Tente novamente.</p>
        <button onclick="window.close()">Fechar</button>
      </body>
      </html>
    `);
  }
});

app.post('/boletos', async (req, res) => {
  try {
    // Aceitar múltiplos formatos de payload (compatibilidade)
    const payload = req.body || {};
    const user_id = payload.user_id || payload.uid || payload.userId || null;
    const cpf_cnpj = payload.cpf_cnpj || payload.cpfCnpj || null;
    const codigo_barras = payload.codigo_barras || payload.codigoBarras || null;
    const valor_brl = payload.valor_brl != null ? Number(payload.valor_brl) : (payload.valor != null ? Number(payload.valor) : null);
    const valor_usdt = payload.valor_usdt != null ? Number(payload.valor_usdt) : null;
    const instituicao = payload.instituicao || null;
    const status = (payload.status || 'pendente').toString().toLowerCase();
    const vencimento = payload.vencimento ? new Date(payload.vencimento) : null;

    if (!cpf_cnpj || !codigo_barras || !valor_brl || !vencimento || !instituicao) {
      return res.status(400).json({
        error: 'Dados obrigatórios ausentes',
        required: ['cpf_cnpj', 'codigo_barras', 'valor_brl', 'vencimento', 'instituicao']
      });
    }

    // Normalizar número de controle: usar informado ou gerar pelo banco
    let numeroControleInformado = payload.numero_controle || payload.numeroControle || null;
    if (numeroControleInformado) {
      numeroControleInformado = String(numeroControleInformado).replace(/\D/g, '').padStart(3, '0');
    }

    let numeroControle = numeroControleInformado;
    if (!numeroControle) {
      // Usa maior numero_controle + 1 (seguro mesmo com gaps)
      const result = await pool.query("SELECT COALESCE(MAX(CAST(NULLIF(numero_controle, '') AS INTEGER)), 0) AS max_nc FROM boletos");
      const next = (Number(result.rows[0].max_nc) + 1) || 1;
      numeroControle = String(next).padStart(3, '0');
    }

    const insertSql = `
      INSERT INTO boletos (
        user_id, cpf_cnpj, codigo_barras, valor_brl, valor_usdt, vencimento, instituicao, status, numero_controle
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const boleto = await getQuery(insertSql, [
      user_id,
      cpf_cnpj,
      codigo_barras,
      Number(valor_brl),
      valor_usdt != null ? Number(valor_usdt) : null,
      vencimento.toISOString().slice(0, 10),
      instituicao,
      status,
      numeroControle
    ]);

    const boletoMapeado = { ...boleto, status: mapStatus(boleto.status) };
    res.status(201).json(boletoMapeado);
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro ao criar boleto', details: error.message });
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
    res.status(500).json({ error: 'Erro ao buscar boletos do usuário', details: error.message });
  }
});

app.get('/boletos/comprados/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const wallet = req.query.wallet;
  try {
    let sql = 'SELECT * FROM boletos WHERE user_id = $1';
    const params = [user_id];
    if (wallet) {
      sql = 'SELECT * FROM boletos WHERE user_id = $1 OR wallet_address = $2';
      params.push(wallet);
    }
    sql += ' ORDER BY criado_em DESC';

    const boletos = await allQuery(sql, params);
    const boletosMapeados = boletos.map(boleto => ({
      ...boleto,
      status: mapStatus(boleto.status)
    }));
    res.json(boletosMapeados);
  } catch (error) {
    console.error('Erro ao buscar boletos comprados:', error);
    res.status(500).json({ error: 'Erro ao buscar boletos comprados', details: error.message });
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
    res.status(500).json({ error: 'Erro ao atualizar perfil', details: error.message });
  }
});

app.get('/perfil/:firebase_uid', async (req, res) => {
  const { firebase_uid } = req.params;
  console.log('🔍 Buscando perfil para UID:', firebase_uid);
  
  try {
    const result = await getQuery('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
    console.log('📊 Resultado da busca de perfil:', result);
    
    if (result) {
      console.log('✅ Perfil encontrado:', {
        firebase_uid: result.firebase_uid,
        nome: result.nome,
        email: result.email,
        telefone: result.telefone
      });
    } else {
      console.log('❌ Perfil não encontrado para UID:', firebase_uid);
    }
    
    res.json(result || {});
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil', details: error.message });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor', 
    details: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Exportar para Vercel Functions
module.exports = app;

// Iniciar servidor apenas se não estiver no Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend Neon PostgreSQL rodando na porta ${PORT}`);
    console.log(`📊 DATABASE_URL configurado: ${process.env.DATABASE_URL ? 'Sim' : 'Não'}`);
    
    // Iniciar serviço de timeout automático apenas em desenvolvimento local
    try {
      const AutoTimeoutService = require('./services/AutoTimeoutService');
      const autoTimeoutService = new AutoTimeoutService();
      autoTimeoutService.start();
      console.log('⏰ AutoTimeoutService iniciado para desenvolvimento local');
    } catch (error) {
      console.error('❌ Erro ao iniciar AutoTimeoutService:', error.message);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    if (pool) {
      pool.end();
      console.log('✅ Conexão Neon PostgreSQL fechada com sucesso');
    }
    process.exit(0);
  });
}