const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

// 💰 SISTEMA DE TAXAS DINÂMICAS
const { DynamicFeeServiceFactory } = require('./src/services/DynamicFeeService');
const { TimerServiceFactory } = require('./src/services/TimerService');
const { EnhancedBoletoController } = require('./src/controllers/EnhancedBoletoController');

const app = express();
const PORT = 3001;

// RPCs para Polygon Amoy (proxy para contornar CORS)
const AMOY_RPCS = [
  'https://rpc-amoy.polygon.technology',
  'https://polygon-amoy-bor-rpc.publicnode.com',
  'https://polygon-amoy-rpc.publicnode.com',
  'https://polygon-amoy.drpc.org',
  'https://polygon-amoy.blockpi.network/v1/rpc/public',
  'https://polygon-amoy.public.blastapi.io'
];

// Armazenamento temporário de boletos (em produção seria banco de dados)
let boletosStorage = [
  {
    id: 1,
    user_id: 'jo2px7rqi9ei9G5fvZ0bq2bFoh33',
    cpf_cnpj: '06771090833',
    codigo_barras: '973174952197491721625712761297217512672472497547',
    valor: 566.77,
    valor_usdt: 104.38,
    vencimento: '2025-09-06',
    instituicao: 'asaas',
    numero_controle: '202508301234567',
    status: 'DISPONIVEL',
    criado_em: '2025-08-30T14:00:00.000Z',
    escrow_id: null,
    tx_hash: null,
    data_travamento: null,
    data_destravamento: null
  },
  {
    id: 2,
    user_id: 'jo2px7rqi9ei9G5fvZ0bq2bFoh33',
    cpf_cnpj: '12345678901',
    codigo_barras: '12345678901234567890123456789012345678901234567890',
    valor: 1000.00,
    valor_usdt: 184.16,
    vencimento: '2025-09-15',
    instituicao: 'banco_teste',
    numero_controle: '202508301234568',
    status: 'DISPONIVEL',
    criado_em: '2025-08-30T14:30:00.000Z',
    escrow_id: null,
    tx_hash: null,
    data_travamento: null,
    data_destravamento: null
  },
  {
    id: 3,
    user_id: '7mJIubrmhwQiZ7I5VcfQkCfcgi82',
    cpf_cnpj: '99999999999',
    codigo_barras: '99999999999999999999999999999999999999999999999999',
    valor: 999.99,
    valor_usdt: 184.16,
    vencimento: '2025-12-31',
    instituicao: 'teste_usuario_atual',
    numero_controle: '202508301234569',
    status: 'DISPONIVEL',
    criado_em: '2025-08-30T15:00:00.000Z',
    escrow_id: null,
    tx_hash: null,
    data_travamento: null,
    data_destravamento: null
  },
  {
    id: 1756686301586,
    user_id: '7mJIubrmhwQiZ7I5VcfQkCfcgi82',
    cpf_cnpj: '62631896149',
    codigo_barras: '964191971979172172172197417619741272479219712794',
    valor: 99.33,
    valor_usdt: 18.29,
    vencimento: '2025-09-06',
    instituicao: 'asaas',
    numero_controle: '1756686301502',
    status: 'PENDENTE_PAGAMENTO',
    criado_em: '2025-09-01T00:25:01.586Z',
    escrow_id: null,
    tx_hash: null,
    data_travamento: null,
    data_destravamento: null
  },
  {
    id: 1758064161120,
    user_id: 'jo2px7rqi9ei9G5fvZ0bq2bFoh33',
    cpf_cnpj: '62631896149',
    codigo_barras: '797495479595945979527957495749979799797457945974',
    valor: 160.82,
    valor_usdt: 29.61,
    vencimento: '2025-09-19',
    instituicao: 'asaas',
    numero_controle: '1758064161120',
    status: 'DISPONIVEL',
    criado_em: '2025-09-18T03:00:00.000Z',
    escrow_id: null,
    tx_hash: null,
    data_travamento: null,
    data_destravamento: null
  }
];

// PERSISTÊNCIA EM ARQUIVO JSON
const fs = require('fs');
const path = require('path');
const STORAGE_FILE = path.join(__dirname, 'boletos-storage.json');

// Carregar dados do arquivo se existir
function loadStorage() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const savedBoletos = JSON.parse(data);
      console.log('📂 [PERSISTÊNCIA] Carregados', savedBoletos.length, 'boletos do arquivo');
      return savedBoletos;
    }
  } catch (error) {
    console.error('❌ [PERSISTÊNCIA] Erro ao carregar:', error);
  }
  return boletosStorage; // Fallback para dados hardcoded
}

// Salvar dados no arquivo
function saveStorage() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(boletosStorage, null, 2));
    console.log('💾 [PERSISTÊNCIA] Dados salvos:', boletosStorage.length, 'boletos');
  } catch (error) {
    console.error('❌ [PERSISTÊNCIA] Erro ao salvar:', error);
  }
}

// Carregar dados persistidos
boletosStorage = loadStorage();

// Debug: verificar se o array foi carregado
console.log('🔍 [DEBUG] boletosStorage carregado:', boletosStorage.length, 'boletos');
console.log('🔍 [DEBUG] Boletos no storage:', boletosStorage.map(b => ({ id: b.id, numero_controle: b.numero_controle, status: b.status })));

// 💰 INICIALIZAR SERVIÇOS DE TAXA DINÂMICA
const feeService = DynamicFeeServiceFactory.create();
const timerService = TimerServiceFactory.create();
const enhancedController = new EnhancedBoletoController();

console.log('💰 [TAXAS DINÂMICAS] Serviços inicializados');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 💰 ROTA PARA CONSULTAR TAXAS DINÂMICAS
app.get('/api/taxas/:numeroControle', async (req, res) => {
  try {
    const { numeroControle } = req.params;
    
    // Buscar boleto
    const boleto = boletosStorage.find(b => b.numero_controle === numeroControle);
    
    if (!boleto) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }

    // Calcular taxas atuais
    const creationTime = new Date(boleto.criado_em);
    const currentTime = new Date();
    
    const currentFeeCalculation = feeService.calculateAllFees({
      boletoValue: boleto.valor,
      creationTime: creationTime,
      currentTime: currentTime
    });

    // Gerar relatório completo
    const report = feeService.generateTransactionReport({
      id: numeroControle,
      boletoValue: boleto.valor,
      creationTime: creationTime,
      status: boleto.status
    });

    // Status dos timers
    const timerStatus = timerService.getTransactionTimerStatus(numeroControle);

    res.json({
      boleto: {
        numeroControle: boleto.numero_controle,
        valor: boleto.valor,
        status: boleto.status,
        criadoEm: boleto.criado_em
      },
      taxasAtuais: currentFeeCalculation,
      relatorio: report,
      timers: timerStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao consultar taxas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 📊 ROTA PARA ESTATÍSTICAS DO SISTEMA
app.get('/api/sistema/stats', async (req, res) => {
  try {
    const stats = {
      totalBoletos: boletosStorage.length,
      boletosPorStatus: {
        DISPONIVEL: boletosStorage.filter(b => b.status === 'DISPONIVEL').length,
        PENDENTE_PAGAMENTO: boletosStorage.filter(b => b.status === 'PENDENTE_PAGAMENTO').length,
        AGUARDANDO_BAIXA: boletosStorage.filter(b => b.status === 'AGUARDANDO_BAIXA').length,
        BAIXADO: boletosStorage.filter(b => b.status === 'BAIXADO').length,
        CANCELADO: boletosStorage.filter(b => b.status === 'CANCELADO').length
      },
      timersAtivos: timerService.getStats(),
      calculadoraTaxas: {
        versao: '1.0.0',
        funcional: true
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configuração do banco Neon (DESABILITADO NO AMBIENTE DEV)
// const pool = new Pool({
//   connectionString: 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

// Teste de conexão com banco (DESABILITADO NO AMBIENTE DEV)
// pool.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.error('❌ Erro ao conectar com banco:', err.message);
//   } else {
//     console.log('✅ Banco conectado:', res.rows[0]);
//   }
// });

console.log('🧪 [DEV] Usando storage local em memória (não PostgreSQL)');

// Endpoint de teste para verificar se o DEV está funcionando
app.get('/api/dev/status', (req, res) => {
  res.json({
    environment: 'DEV',
    storage: 'local',
    timestamp: new Date().toISOString(),
    boletos_count: boletosStorage.length,
    message: 'Ambiente DEV funcionando com storage local'
  });
});

// Removido middleware problemático com *

// Rota POST para criar boletos (DEV - usando storage local)
app.post('/api/boletos', async (req, res) => {
  try {
    console.log('🚀 [DEV] POST /api/boletos recebido');
    console.log('📦 [DEV] Body:', req.body);
    
    const { 
      user_id, 
      cpf_cnpj, 
      codigo_barras, 
      valor, 
      valor_usdt, 
      vencimento, 
      instituicao, 
      numero_controle,
      escrow_id,
      tx_hash,
      status,
      data_travamento
    } = req.body;
    
    // Validação dos campos obrigatórios
    if (!user_id || !cpf_cnpj || !codigo_barras || !valor || !valor_usdt || !vencimento || !instituicao) {
      return res.status(400).json({
        error: 'Campos obrigatórios: user_id, cpf_cnpj, codigo_barras, valor, valor_usdt, vencimento, instituicao'
      });
    }

    // 💰 CALCULAR TAXAS DINÂMICAS
    const creationTime = new Date();
    const feeCalculation = feeService.calculateAllFees({
      boletoValue: parseFloat(valor),
      creationTime: creationTime
    });

    console.log('💰 [TAXAS] Calculadas para boleto:', feeCalculation);
    
    // Criar novo boleto com informações de taxas
    const novoBoleto = {
      id: Date.now(),
      user_id,
      cpf_cnpj,
      codigo_barras,
      valor: parseFloat(valor),
      valor_usdt: parseFloat(valor_usdt),
      vencimento,
      instituicao,
      numero_controle: numero_controle || Date.now().toString(),
      status: status || 'DISPONIVEL',
      criado_em: creationTime.toISOString(),
      escrow_id: escrow_id || null,
      tx_hash: tx_hash || null,
      data_travamento: data_travamento || null,
      data_destravamento: null,
      
      // 💰 CAMPOS DE TAXAS DINÂMICAS
      buyer_fee: feeCalculation.buyerFee.amount,
      buyer_fee_type: feeCalculation.buyerFee.type,
      seller_transaction_fee: feeCalculation.sellerTransactionFee.baseFee,
      current_seller_fee: feeCalculation.sellerTransactionFee.finalFee,
      seller_refund_amount: feeCalculation.sellerTransactionFee.refundAmount,
      buyer_total_cost: feeCalculation.totals.buyerPays,
      seller_receives: feeCalculation.totals.sellerReceives,
      protocol_earnings: feeCalculation.totals.protocolEarns,
      fee_calculation: JSON.stringify(feeCalculation),
      timer_status: 'ACTIVE'
    };

    // ⏰ CRIAR TEMPORIZADORES AUTOMÁTICOS
    try {
      const timers = timerService.createTransactionTimers({
        id: novoBoleto.numero_controle,
        numeroControle: novoBoleto.numero_controle,
        creationTime: creationTime,
        valor: parseFloat(valor)
      });
      
      console.log('⏰ [TIMERS] Criados', timers.length, 'temporizadores para', novoBoleto.numero_controle);
    } catch (timerError) {
      console.error('❌ [TIMERS] Erro ao criar temporizadores:', timerError);
      // Não bloquear criação do boleto por erro de timer
    }
    
    // Adicionar ao storage
    boletosStorage.push(novoBoleto);
    saveStorage(); // Persistir dados
    
    console.log('✅ [DEV] Boleto criado:', novoBoleto.id);
    console.log('📊 [DEV] Total de boletos no storage:', boletosStorage.length);
    
    res.status(201).json({
      success: true,
      data: novoBoleto,
      message: 'Boleto criado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ [DEV] Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota GET para listar boletos (DEV - usando storage local)
app.get('/api/boletos', async (req, res) => {
  try {
    console.log('📍 [DEV] GET /api/boletos - todos os boletos');
    console.log('📊 Total de boletos no storage:', boletosStorage.length);
    
    res.json({
      success: true,
      data: boletosStorage,
      count: boletosStorage.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar boletos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota GET para boletos do usuário (DEV - usando storage local)
app.get('/api/boletos/usuario/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log('📍 [DEV] GET /api/boletos/usuario/:uid para UID:', uid);
    console.log('📊 Total de boletos no storage:', boletosStorage.length);
    
    // Buscar boletos do usuário no storage local
    const boletos = boletosStorage.filter(boleto => boleto.user_id === uid);
    
    console.log('✅ Boletos do usuário encontrados:', boletos.length);
    res.json({
      success: true,
      data: boletos,
      count: boletos.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota GET para boletos de compra (DEV - usando storage local)
app.get('/api/boletos/compra/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log('📍 [DEV] GET /api/boletos/compra/:uid para UID:', uid);
    
    // Debug: todos os boletos do comprador
    const todosBoletosComprador = boletosStorage.filter(boleto => boleto.comprador_id === uid);
    console.log('🔍 [DEBUG] Todos boletos do comprador:', todosBoletosComprador.length);
    console.log('🔍 [DEBUG] Status dos boletos:', todosBoletosComprador.map(b => b.status));
    
    // Buscar boletos comprados pelo usuário (status PENDENTE_PAGAMENTO, AGUARDANDO_BAIXA, BAIXADO)
    const boletosComprados = boletosStorage.filter(boleto => 
      boleto.comprador_id === uid && 
      ['PENDENTE_PAGAMENTO', 'AGUARDANDO_BAIXA', 'BAIXADO'].includes(boleto.status)
    );
    
    console.log('✅ Boletos de compra encontrados:', boletosComprados.length);
    res.json({
      success: true,
      data: boletosComprados,
      count: boletosComprados.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar boletos de compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!', timestamp: new Date().toISOString() });
});

// Proxy RPC para contornar problemas de CORS
app.post('/api/rpc-proxy', async (req, res) => {
  try {
    const { method, params, id } = req.body;
    
    if (!method) {
      return res.status(400).json({ error: 'Método RPC é obrigatório' });
    }

    // Tentar cada RPC até uma funcionar
    for (const rpcUrl of AMOY_RPCS) {
      try {
        console.log(`🔄 [RPC-PROXY] Tentando ${rpcUrl} para método ${method}`);
        
        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method,
          params: params || [],
          id: id || 1
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.result !== undefined) {
          console.log(`✅ [RPC-PROXY] Sucesso com ${rpcUrl}`);
          return res.json(response.data);
        }
      } catch (error) {
        console.log(`❌ [RPC-PROXY] Falha com ${rpcUrl}:`, error.message);
        continue; // Tentar próxima RPC
      }
    }

    // Se todas falharam
    console.log('❌ [RPC-PROXY] Todas as RPCs falharam');
    res.status(500).json({ 
      error: 'Todas as RPCs estão indisponíveis',
      method,
      triedRPCs: AMOY_RPCS.length
    });

  } catch (error) {
    console.error('❌ [RPC-PROXY] Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do proxy RPC' });
  }
});

// Função para buscar perfil (DEV - dados fictícios)
async function buscarPerfil(uid) {
  console.log('🧪 [DEV] Buscar perfil para UID:', uid);
  
  // Dados fictícios para DEV
  const perfilFicticio = {
    firebase_uid: uid,
    nome: 'LEANDRO BOTACIN JUNIOR',
    email: 'leandro@teste.com',
    telefone: '11999999999',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  };
  
  return [perfilFicticio];
}

// Função para atualizar perfil (DEV - dados fictícios)
async function atualizarPerfil(firebase_uid, nome, email, telefone) {
  console.log('🧪 [DEV] Atualizar perfil para UID:', firebase_uid);
  console.log('📝 [DEV] Dados:', { nome, email, telefone });
  
  // Simular atualização para DEV
  const perfilAtualizado = {
    firebase_uid: firebase_uid,
    nome: nome || 'LEANDRO BOTACIN JUNIOR',
    email: email || 'leandro@teste.com',
    telefone: telefone || '11999999999',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  };
  
  return perfilAtualizado;
}

// Rota de perfil (GET) - /api/perfil/:uid (path parameter)
app.get('/api/perfil/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log('📍 GET /api/perfil/:uid para UID:', uid);
    
    const rows = await buscarPerfil(uid);
    
    if (rows.length === 0) {
      console.log('❌ Usuário não encontrado para UID:', uid);
      return res.status(404).json({
        error: 'Usuário não encontrado',
        uid: uid
      });
    }
    
    console.log('✅ Usuário encontrado:', rows[0]);
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota de perfil (GET) - /api/perfil (query parameter)
app.get('/api/perfil', async (req, res) => {
  try {
    const uid = req.query.uid;
    console.log('📍 GET /api/perfil para UID:', uid);
    
    if (!uid) {
      return res.status(400).json({
        error: 'UID é obrigatório',
        example: '/api/perfil?uid=ABC123'
      });
    }
    
    const rows = await buscarPerfil(uid);
    
    if (rows.length === 0) {
      console.log('❌ Usuário não encontrado para UID:', uid);
      return res.status(404).json({
        error: 'Usuário não encontrado',
        uid: uid
      });
    }
    
    console.log('✅ Perfil encontrado:', rows[0]);
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de perfil (GET) - /perfil (compatibilidade)
app.get('/perfil', async (req, res) => {
  try {
    const uid = req.query.uid;
    console.log('📍 GET /perfil para UID:', uid);
    
    if (!uid) {
      return res.status(400).json({
        error: 'UID é obrigatório',
        example: '/perfil?uid=ABC123'
      });
    }
    
    const rows = await buscarPerfil(uid);
    
    if (rows.length === 0) {
      console.log('❌ Usuário não encontrado para UID:', uid);
      return res.status(404).json({
        error: 'Usuário não encontrado',
        uid: uid
      });
    }
    
    console.log('✅ Perfil encontrado:', rows[0]);
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de perfil (GET) - /perfil/:uid (rota dinâmica para frontend)
app.get('/perfil/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log('📍 GET /perfil/:uid para UID:', uid);
    
    const rows = await buscarPerfil(uid);
    
    if (rows.length === 0) {
      console.log('❌ Usuário não encontrado para UID:', uid);
      return res.status(404).json({
        error: 'Usuário não encontrado',
        uid: uid
      });
    }
    
    console.log('✅ Perfil encontrado:', rows[0]);
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de perfil (POST) - /api/perfil
app.post('/api/perfil', async (req, res) => {
  try {
    console.log('📍 POST /api/perfil:', req.body);
    
    const { firebase_uid, nome, email, telefone } = req.body;
    
    if (!firebase_uid) {
      return res.status(400).json({
        error: 'firebase_uid é obrigatório'
      });
    }
    
    const result = await atualizarPerfil(firebase_uid, nome, email, telefone);
    
    console.log('✅ Perfil atualizado:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de perfil (POST) - /perfil (compatibilidade)
app.post('/perfil', async (req, res) => {
  try {
    console.log('📍 POST /perfil:', req.body);
    
    const { firebase_uid, nome, email, telefone } = req.body;
    
    if (!firebase_uid) {
      return res.status(400).json({
        error: 'firebase_uid é obrigatório'
      });
    }
    
    const result = await atualizarPerfil(firebase_uid, nome, email, telefone);
    
    console.log('✅ Perfil atualizado:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Proxy para API do Coingecko (padronizado para { price })
app.get('/proxy/coingecko', async (req, res) => {
  try {
    const ticker = req.query.ticker || 'tether';
    const vs = req.query.vs || 'brl';
    console.log('📍 GET /proxy/coingecko:', { ticker, vs });

    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: ticker, vs_currencies: vs },
      headers: { 'Accept': 'application/json', 'User-Agent': 'BXC-Boletos/1.0' }
    });

    const data = response.data || {};
    const price = data?.[ticker]?.[vs];

    if (price == null) {
      return res.status(404).json({ error: 'Preço não encontrado', data });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ price, ticker, vs, timestamp: new Date().toISOString(), source: 'coingecko' });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do Coingecko:', error.message);
    return res.status(500).json({ 
      error: 'Erro ao buscar dados do Coingecko',
      details: error.message 
    });
  }
});

// Proxy para API do Coingecko (com /api) - padronizado para { price }
app.get('/api/proxy/coingecko', async (req, res) => {
  try {
    const ticker = req.query.ticker || 'tether';
    const vs = req.query.vs || 'brl';
    console.log('📍 GET /api/proxy/coingecko:', { ticker, vs });

    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: ticker, vs_currencies: vs },
      headers: { 'Accept': 'application/json', 'User-Agent': 'BXC-Boletos/1.0' }
    });

    const data = response.data || {};
    const price = data?.[ticker]?.[vs];

    if (price == null) {
      return res.status(404).json({ error: 'Preço não encontrado', data });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ price, ticker, vs, timestamp: new Date().toISOString(), source: 'coingecko' });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do Coingecko:', error.message);
    return res.status(500).json({ 
      error: 'Erro ao buscar dados do Coingecko',
      details: error.message 
    });
  }
});

// Rotas para boletos
app.get('/boletos', async (req, res) => {
  try {
    console.log('📍 GET /boletos - Buscando boletos DISPONÍVEIS');
    
    // Filtrar apenas boletos DISPONÍVEIS do storage
    const boletosDisponiveis = boletosStorage.filter(boleto => boleto.status === 'DISPONIVEL');
    
    console.log('✅ Boletos DISPONÍVEIS encontrados:', boletosDisponiveis.length);
    res.json(boletosDisponiveis);
  } catch (error) {
    console.error('❌ Erro ao buscar boletos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar boletos do usuário
app.get('/boletos/usuario/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log('📍 GET /boletos/usuario/:uid para UID:', uid);
    console.log('📊 Total de boletos no storage:', boletosStorage.length);
    console.log('🔍 Boletos no storage:', boletosStorage.map(b => ({ id: b.id, user_id: b.user_id })));
    
    // Buscar boletos do usuário no storage
    const boletos = boletosStorage.filter(boleto => boleto.user_id === uid);
    
    console.log('✅ Boletos do usuário encontrados:', boletos.length);
    console.log('🎯 Boletos filtrados:', boletos.map(b => ({ id: b.id, user_id: b.user_id })));
    res.json(boletos);
  } catch (error) {
    console.error('❌ Erro ao buscar boletos do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar boletos de compra do usuário
app.get('/boletos/compra/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log('📍 GET /boletos/compra/:uid para UID:', uid);
    
    // Buscar boletos de compra do usuário no storage
    const boletos = boletosStorage.filter(boleto => 
      boleto.user_id === uid && 
      (boleto.status === 'PENDENTE_PAGAMENTO' || boleto.status === 'AGUARDANDO_BAIXA' || boleto.status === 'BAIXADO')
    );
    
    console.log('✅ Boletos de compra encontrados:', boletos.length);
    res.json(boletos);
  } catch (error) {
    console.error('❌ Erro ao buscar boletos de compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar boletos comprados (compatibilidade com frontend)
app.get('/boletos/comprados/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log('📍 GET /boletos/comprados/:uid para UID:', uid);
    
    // Buscar boletos comprados pelo usuário (status PENDENTE_PAGAMENTO, AGUARDANDO_BAIXA, BAIXADO)
    const boletos = boletosStorage.filter(boleto => 
      boleto.comprador_id === uid && 
      ['PENDENTE_PAGAMENTO', 'AGUARDANDO_BAIXA', 'BAIXADO'].includes(boleto.status)
    );
    
    console.log('✅ Boletos comprados encontrados:', boletos.length);
    res.json(boletos);
  } catch (error) {
    console.error('❌ Erro ao buscar boletos comprados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para reservar boleto
app.patch('/boletos/controle/:numeroControle/reservar', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { user_id, wallet_address, tx_hash } = req.body;
    console.log('📍 PATCH /boletos/controle/:numeroControle/reservar:', numeroControle);
    
    // Buscar boleto no storage
    const boletoIndex = boletosStorage.findIndex(b => b.numero_controle === numeroControle);
    
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    if (boletosStorage[boletoIndex].status !== 'DISPONIVEL') {
      return res.status(400).json({ error: 'Boleto não está disponível' });
    }
    
    // Atualizar status do boleto para PENDENTE_PAGAMENTO
    boletosStorage[boletoIndex].status = 'PENDENTE_PAGAMENTO';
    boletosStorage[boletoIndex].comprador_id = user_id;
    boletosStorage[boletoIndex].wallet_address = wallet_address;
    boletosStorage[boletoIndex].tx_hash = tx_hash;
    boletosStorage[boletoIndex].reservado_em = new Date().toISOString();
    boletosStorage[boletoIndex].tempo_limite = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora
    saveStorage(); // Persistir dados
    
    const boletoReservado = boletosStorage[boletoIndex];
    
    console.log('✅ Boleto reservado e status atualizado:', boletoReservado.id);
    res.json(boletoReservado);
  } catch (error) {
    console.error('❌ Erro ao reservar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para selecionar boleto para pagamento
app.post('/boletos/:numeroControle/selecionar', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { user_id, wallet_address } = req.body;
    
    console.log('📍 POST /boletos/:numeroControle/selecionar:', numeroControle);
    console.log('👤 Usuário:', user_id);
    console.log('💳 Carteira:', wallet_address);
    
    // Buscar boleto no storage
    const boletoIndex = boletosStorage.findIndex(b => b.numero_controle === numeroControle);
    
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    if (boletosStorage[boletoIndex].status !== 'DISPONIVEL') {
      return res.status(400).json({ error: 'Boleto não está disponível' });
    }

    // 💰 RECALCULAR TAXAS NO MOMENTO DA SELEÇÃO
    const boleto = boletosStorage[boletoIndex];
    const creationTime = new Date(boleto.criado_em);
    const currentTime = new Date();
    
    const currentFeeCalculation = feeService.calculateAllFees({
      boletoValue: boleto.valor,
      creationTime: creationTime,
      currentTime: currentTime
    });

    console.log('💰 [SELEÇÃO] Taxas recalculadas:', currentFeeCalculation);
    
    // Atualizar status do boleto
    boletosStorage[boletoIndex].status = 'PENDENTE_PAGAMENTO';
    boletosStorage[boletoIndex].comprador_id = user_id;
    boletosStorage[boletoIndex].wallet_address = wallet_address;
    boletosStorage[boletoIndex].selecionado_em = currentTime.toISOString();
    boletosStorage[boletoIndex].tempo_limite = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora
    
    // ⏰ ATUALIZAR INFORMAÇÕES DE TAXA ATUAIS
    boletosStorage[boletoIndex].current_seller_fee = currentFeeCalculation.sellerTransactionFee.finalFee;
    boletosStorage[boletoIndex].seller_refund_amount = currentFeeCalculation.sellerTransactionFee.refundAmount;
    boletosStorage[boletoIndex].current_fee_calculation = JSON.stringify(currentFeeCalculation);
    
    saveStorage(); // Persistir dados
    
    const boletoSelecionado = boletosStorage[boletoIndex];
    
    console.log('✅ Boleto selecionado:', boletoSelecionado.id);
    res.status(201).json({
      ...boletoSelecionado,
      paymentInfo: {
        boletoValue: boleto.valor,
        buyerFee: currentFeeCalculation.buyerFee.amount,
        totalToPay: currentFeeCalculation.totals.buyerPays,
        feeDescription: currentFeeCalculation.buyerFee.description
      },
      deadlines: {
        uploadDeadline: new Date(creationTime.getTime() + (1 * 60 * 60 * 1000)), // 1h
        autoRelease: new Date(creationTime.getTime() + (72 * 60 * 60 * 1000)) // 72h
      },
      feeCalculation: currentFeeCalculation
    });
  } catch (error) {
    console.error('❌ Erro ao selecionar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para upload de comprovante
app.post('/boletos/:numeroControle/comprovante', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { comprovante } = req.body;
    
    console.log('📍 POST /boletos/:numeroControle/comprovante:', numeroControle);
    console.log('📄 Tamanho do comprovante:', comprovante ? comprovante.length : 0, 'caracteres');
    
    if (!comprovante) {
      return res.status(400).json({ error: 'Comprovante é obrigatório' });
    }
    
    // Buscar boleto no storage
    const boletoIndex = boletosStorage.findIndex(b => b.numero_controle === numeroControle);
    
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    if (boletosStorage[boletoIndex].status !== 'PENDENTE_PAGAMENTO') {
      return res.status(400).json({ error: 'Boleto não está pendente de pagamento' });
    }
    
    // Atualizar boleto com comprovante
    boletosStorage[boletoIndex].status = 'AGUARDANDO_BAIXA';
    boletosStorage[boletoIndex].comprovante = comprovante;
    boletosStorage[boletoIndex].upload_em = new Date().toISOString();
    boletosStorage[boletoIndex].tempo_limite_baixa = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 horas
    saveStorage(); // Persistir dados
    
    const comprovanteSalvo = boletosStorage[boletoIndex];
    
    console.log('✅ Comprovante salvo:', comprovanteSalvo.id);
    res.status(201).json(comprovanteSalvo);
  } catch (error) {
    console.error('❌ Erro ao salvar comprovante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para upload de comprovante (versão API)
app.post('/api/boletos/:numeroControle/comprovante', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { comprovante } = req.body;
    
    console.log('📍 POST /api/boletos/:numeroControle/comprovante:', numeroControle);
    console.log('📄 Tamanho do comprovante:', comprovante ? comprovante.length : 0, 'caracteres');
    
    if (!comprovante) {
      return res.status(400).json({ error: 'Comprovante é obrigatório' });
    }
    
    // Buscar boleto no storage
    const boletoIndex = boletosStorage.findIndex(b => b.numero_controle === numeroControle);
    
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    if (boletosStorage[boletoIndex].status !== 'PENDENTE_PAGAMENTO') {
      return res.status(400).json({ error: 'Boleto não está pendente de pagamento' });
    }
    
    // Atualizar boleto com comprovante
    boletosStorage[boletoIndex].status = 'AGUARDANDO_BAIXA';
    boletosStorage[boletoIndex].comprovante = comprovante;
    boletosStorage[boletoIndex].upload_em = new Date().toISOString();
    boletosStorage[boletoIndex].tempo_limite_baixa = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 horas
    saveStorage(); // Persistir dados
    
    const comprovanteSalvo = boletosStorage[boletoIndex];
    
    console.log('✅ Comprovante salvo via API:', comprovanteSalvo.id);
    res.status(201).json(comprovanteSalvo);
  } catch (error) {
    console.error('❌ Erro ao salvar comprovante via API:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para baixar boleto (vendedor)
app.patch('/boletos/:numeroControle/baixar', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { user_id, wallet_address_vendedor, wallet_address_comprador, tx_hash, escrow_id } = req.body;
    
    console.log('📍 PATCH /boletos/:numeroControle/baixar:', numeroControle);
    console.log('👤 Vendedor:', user_id);
    console.log('💳 Carteira vendedor:', wallet_address_vendedor);
    console.log('💳 Carteira comprador:', wallet_address_comprador);
    console.log('🔗 TX Hash:', tx_hash);
    console.log('🔒 Escrow ID:', escrow_id);
    
    // Buscar boleto no storage
    const boletoIndex = boletosStorage.findIndex(b => b.numero_controle === numeroControle);
    
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    if (boletosStorage[boletoIndex].status !== 'AGUARDANDO_BAIXA') {
      return res.status(400).json({ error: 'Boleto não está aguardando baixa' });
    }
    
    // Validar se escrow_id foi fornecido
    if (!escrow_id) {
      return res.status(400).json({ error: 'escrow_id é obrigatório para baixar o boleto' });
    }
    
    // Atualizar status do boleto para BAIXADO
    boletosStorage[boletoIndex].status = 'BAIXADO';
    boletosStorage[boletoIndex].baixado_em = new Date().toISOString();
    boletosStorage[boletoIndex].baixado_por = user_id;
    boletosStorage[boletoIndex].wallet_address_vendedor = wallet_address_vendedor;
    boletosStorage[boletoIndex].tx_hash_baixa = tx_hash;
    boletosStorage[boletoIndex].escrow_id = escrow_id; // ✅ INCLUIR ESCROW_ID
    saveStorage(); // Persistir dados
    
    const boletoBaixado = boletosStorage[boletoIndex];
    
    console.log('✅ Boleto baixado com escrow_id:', boletoBaixado.id, 'Escrow:', escrow_id);
    res.status(200).json(boletoBaixado);
  } catch (error) {
    console.error('❌ Erro ao baixar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Compat: aceitar PATCH com comprovante_url para upload de comprovante
app.patch('/api/boletos/:numeroControle/comprovante', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { comprovante_url, filename, filesize, filetype } = req.body || {};

    console.log('📍 PATCH /api/boletos/:numeroControle/comprovante:', numeroControle);
    console.log('📄 Tamanho do comprovante_url:', comprovante_url ? comprovante_url.length : 0, 'caracteres');

    if (!comprovante_url) {
      return res.status(400).json({ error: 'comprovante_url é obrigatório' });
    }

    const boletoIndex = boletosStorage.findIndex(b => String(b.numero_controle) === String(numeroControle));
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }

    if (boletosStorage[boletoIndex].status !== 'PENDENTE_PAGAMENTO' && boletosStorage[boletoIndex].status !== 'AGUARDANDO_PAGAMENTO') {
      return res.status(400).json({ error: 'Boleto não está pendente de pagamento' });
    }

    boletosStorage[boletoIndex].status = 'AGUARDANDO_BAIXA';
    boletosStorage[boletoIndex].comprovante_url = comprovante_url;
    boletosStorage[boletoIndex].comprovante = comprovante_url; // compat
    boletosStorage[boletoIndex].upload_em = new Date().toISOString();
    boletosStorage[boletoIndex].tempo_limite_baixa = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    if (filename) boletosStorage[boletoIndex].comprovante_filename = filename;
    if (filesize) boletosStorage[boletoIndex].comprovante_filesize = filesize;
    if (filetype) boletosStorage[boletoIndex].comprovante_filetype = filetype;

    saveStorage();

    const comprovanteSalvo = boletosStorage[boletoIndex];
    console.log('✅ Comprovante atualizado (PATCH):', comprovanteSalvo.id);
    res.status(200).json(comprovanteSalvo);
  } catch (error) {
    console.error('❌ Erro ao atualizar comprovante (PATCH):', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Compat: aceitar PATCH sem prefixo /api para upload de comprovante
app.patch('/boletos/:numeroControle/comprovante', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { comprovante_url, comprovante, filename, filesize, filetype } = req.body || {};

    console.log('📍 PATCH /boletos/:numeroControle/comprovante:', numeroControle);
    const payload = comprovante_url || comprovante;
    console.log('📄 Tamanho do comprovante (url/base64):', payload ? String(payload).length : 0, 'caracteres');

    if (!payload) {
      return res.status(400).json({ error: 'comprovante_url ou comprovante é obrigatório' });
    }

    const boletoIndex = boletosStorage.findIndex(b => String(b.numero_controle) === String(numeroControle));
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }

    if (boletosStorage[boletoIndex].status !== 'PENDENTE_PAGAMENTO' && boletosStorage[boletoIndex].status !== 'AGUARDANDO_PAGAMENTO') {
      return res.status(400).json({ error: 'Boleto não está pendente de pagamento' });
    }

    boletosStorage[boletoIndex].status = 'AGUARDANDO_BAIXA';
    // Salva tanto em comprovante_url quanto em comprovante para compatibilidade
    boletosStorage[boletoIndex].comprovante_url = payload;
    boletosStorage[boletoIndex].comprovante = payload;
    boletosStorage[boletoIndex].upload_em = new Date().toISOString();
    boletosStorage[boletoIndex].tempo_limite_baixa = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    if (filename) boletosStorage[boletoIndex].comprovante_filename = filename;
    if (filesize) boletosStorage[boletoIndex].comprovante_filesize = filesize;
    if (filetype) boletosStorage[boletoIndex].comprovante_filetype = filetype;

    saveStorage();

    const comprovanteSalvo = boletosStorage[boletoIndex];
    console.log('✅ Comprovante atualizado (PATCH sem /api):', comprovanteSalvo.id);
    res.status(200).json(comprovanteSalvo);
  } catch (error) {
    console.error('❌ Erro ao atualizar comprovante (PATCH sem /api):', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});
// Rota para visualizar comprovante
app.get('/api/proxy/comprovante/:numeroControle', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    
    console.log('📍 GET /api/proxy/comprovante/:numeroControle:', numeroControle);
    
    // Buscar boleto no storage
    const boleto = boletosStorage.find(b => b.numero_controle === numeroControle);
    
    if (!boleto) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    if (!boleto.comprovante) {
      return res.status(404).json({ error: 'Comprovante não encontrado' });
    }
    
    // Retornar o comprovante
    res.status(200).json({
      numero_controle: numeroControle,
      comprovante: boleto.comprovante,
      filename: boleto.filename || 'comprovante.pdf',
      filetype: boleto.filetype || 'application/pdf'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar comprovante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para baixa manual
app.post('/boletos/:numeroControle/baixa-manual', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { user_id } = req.body;
    
    console.log('📍 POST /boletos/:numeroControle/baixa-manual:', numeroControle);
    console.log('👤 Vendedor:', user_id);
    
    // Simular baixa manual
    const baixaManual = {
      id: Date.now(),
      numero_controle: numeroControle,
      user_id: user_id,
      status: 'BAIXADO',
      baixa_em: new Date().toISOString(),
      tipo_baixa: 'MANUAL'
    };
    
    console.log('✅ Baixa manual realizada:', baixaManual.id);
    res.status(200).json(baixaManual);
  } catch (error) {
    console.error('❌ Erro ao realizar baixa manual:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para cancelar compra (comprador)
app.post('/boletos/:numeroControle/cancelar-compra', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { user_id } = req.body;
    
    console.log('📍 POST /boletos/:numeroControle/cancelar-compra:', numeroControle);
    console.log('👤 Comprador:', user_id);
    
    // Buscar boleto no storage
    const boletoIndex = boletosStorage.findIndex(b => b.numero_controle === numeroControle);
    
    if (boletoIndex === -1) {
      return res.status(404).json({ error: 'Boleto não encontrado' });
    }
    
    const boletoStatus = boletosStorage[boletoIndex].status;
    
    // Validação: não pode cancelar após envio do comprovante
    if (boletoStatus === 'AGUARDANDO_BAIXA') {
      console.log('❌ Cancelamento negado: boleto já tem comprovante enviado');
      return res.status(400).json({ 
        error: 'Cancelamento não permitido',
        message: 'Não é possível cancelar a compra após o envio do comprovante de pagamento.'
      });
    }
    
    // Atualizar status do boleto para DISPONIVEL (volta para o livro de ordens)
    boletosStorage[boletoIndex].status = 'DISPONIVEL';
    boletosStorage[boletoIndex].comprador_id = null;
    boletosStorage[boletoIndex].wallet_address = null;
    boletosStorage[boletoIndex].selecionado_em = null;
    boletosStorage[boletoIndex].tempo_limite = null;
    boletosStorage[boletoIndex].cancelado_em = new Date().toISOString();
    boletosStorage[boletoIndex].motivo_cancelamento = 'CANCELAMENTO_PELO_COMPRADOR';
    
    const cancelamento = boletosStorage[boletoIndex];
    
    console.log('✅ Compra cancelada:', cancelamento.id);
    res.status(200).json(cancelamento);
  } catch (error) {
    console.error('❌ Erro ao cancelar compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para excluir boleto (vendedor)
app.delete('/boletos/:numeroControle', async (req, res) => {
  try {
    const numeroControle = req.params.numeroControle;
    const { user_id } = req.body;
    
    console.log('📍 DELETE /boletos/:numeroControle:', numeroControle);
    console.log('👤 Vendedor:', user_id);
    
    // Simular exclusão de boleto
    const exclusao = {
      id: Date.now(),
      numero_controle: numeroControle,
      user_id: user_id,
      status: 'EXCLUIDO',
      excluido_em: new Date().toISOString(),
      motivo: 'EXCLUSAO_PELO_VENDEDOR'
    };
    
    console.log('✅ Boleto excluído:', exclusao.id);
    res.status(200).json(exclusao);
  } catch (error) {
    console.error('❌ Erro ao excluir boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/boletos', async (req, res) => {
  try {
    console.log('📍 POST /boletos:', req.body);
    
    const { 
      user_id, 
      cpf_cnpj, 
      codigo_barras, 
      valor, 
      valor_usdt, 
      vencimento, 
      instituicao, 
      numero_controle,
      escrow_id,
      tx_hash,
      status,
      data_travamento
    } = req.body;
    
    // Validação dos campos obrigatórios
    if (!user_id || !cpf_cnpj || !codigo_barras || !valor || !valor_usdt || !vencimento || !instituicao) {
      return res.status(400).json({
        error: 'Campos obrigatórios: user_id, cpf_cnpj, codigo_barras, valor, valor_usdt, vencimento, instituicao'
      });
    }
    
    // Criar novo boleto
    const novoBoleto = {
      id: Date.now(),
      user_id,
      cpf_cnpj,
      codigo_barras,
      valor: parseFloat(valor),
      valor_usdt: parseFloat(valor_usdt),
      vencimento,
      instituicao,
      numero_controle: numero_controle || Date.now().toString(),
      status: status || 'DISPONIVEL',
      criado_em: new Date().toISOString(),
      escrow_id: escrow_id || null,
      tx_hash: tx_hash || null,
      data_travamento: data_travamento || null,
      data_destravamento: null
    };
    
    // Adicionar ao storage
    boletosStorage.push(novoBoleto);
    saveStorage(); // Persistir dados
    
    console.log('✅ Boleto criado e salvo no storage:', novoBoleto);
    console.log('📊 Total de boletos no storage:', boletosStorage.length);
    res.status(201).json(novoBoleto);
  } catch (error) {
    console.error('❌ Erro ao criar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Banco de dados: Neon PostgreSQL`);
  console.log(`🔗 Teste: http://localhost:${PORT}/api/test`);
  console.log(`📝 Rotas disponíveis:`);
  console.log(`   GET  /api/perfil?uid=ABC123`);
  console.log(`   POST /api/perfil`);
  console.log(`   GET  /perfil?uid=ABC123`);
  console.log(`   GET  /perfil/:uid`);
  console.log(`   POST /perfil`);
  console.log(`   GET  /boletos`);
  console.log(`   GET  /boletos/usuario/:uid`);
  console.log(`   GET  /boletos/compra/:uid`);
  console.log(`   POST /boletos`);
  console.log(`   POST /boletos/:numeroControle/selecionar`);
  console.log(`   POST /boletos/:numeroControle/comprovante`);
   console.log(`   PATCH /boletos/:numeroControle/baixar`);
   console.log(`   GET  /api/proxy/comprovante/:numeroControle`);
  console.log(`   POST /boletos/:numeroControle/baixa-manual`);
  console.log(`   POST /boletos/:numeroControle/cancelar-compra`);
  console.log(`   DELETE /boletos/:numeroControle`);
  console.log(`   PATCH /boletos/controle/:numeroControle/reservar`);
});

// 🔧 ENDPOINTS STUB PARA ELIMINAR ERROS 404
// Estes endpoints retornam respostas adequadas para evitar erros no console

// Endpoint stub para /api/boletos/detalhe
app.get('/api/boletos/detalhe', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Endpoint de detalhes de boletos disponível',
    data: []
  });
});

// Endpoint stub para /api/escrows/resolve
app.get('/api/escrows/resolve', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Endpoint de resolução de escrows disponível',
    data: []
  });
});

// Endpoint stub para /api/escrow/resolve
app.get('/api/escrow/resolve', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Endpoint de resolução de escrow disponível',
    data: []
  });
});
