const { Pool } = require('pg');

// Configuração do banco com fallback seguro (evita localhost em produção)
const resolveDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
  if (envUrl && !isLocal) return envUrl;
  // Fallback para Neon já usado no projeto (mesma string de api/index.js)
  return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
};

const pool = new Pool({
  connectionString: resolveDatabaseUrl(),
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

module.exports = async (req, res) => {
  // 1. CORS Headers (OBRIGATÓRIO)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 2. Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 🔄 VERIFICAÇÃO AUTOMÁTICA DE BOLETOS EXPIRADOS (60 MINUTOS)
    try {
      const agora = new Date();
      const limite60Minutos = new Date(agora.getTime() - (60 * 60 * 1000)); // 60 minutos atrás
      
      // Buscar boletos expirados (AGUARDANDO_PAGAMENTO há mais de 60 minutos)
      const boletosExpirados = await pool.query(`
        SELECT id, numero_controle, status, data_travamento
        FROM boletos
        WHERE status = 'AGUARDANDO_PAGAMENTO'
        AND data_travamento IS NOT NULL
        AND data_travamento <= $1
      `, [limite60Minutos.toISOString()]);
      
      if (boletosExpirados.rowCount > 0) {
        console.log(`🔄 [AUTO-DESTRAVAR] Encontrados ${boletosExpirados.rowCount} boletos expirados`);
        
        // Destravar cada boleto expirado
        for (const boleto of boletosExpirados.rows) {
          try {
            await pool.query(`
              UPDATE boletos
              SET status = 'DISPONIVEL',
                  data_destravamento = $1,
                  comprador_id = NULL,
                  wallet_address = NULL,
                  data_travamento = NULL
              WHERE id = $2
            `, [agora.toISOString(), boleto.id]);
            
            console.log(`✅ [AUTO-DESTRAVAR] Boleto ${boleto.numero_controle} destravado automaticamente`);
          } catch (error) {
            console.error(`❌ [AUTO-DESTRAVAR] Erro ao destravar boleto ${boleto.id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ [AUTO-DESTRAVAR] Erro na verificação automática:', error.message);
    }
    
    // 🚀 MIGRAÇÃO AUTOMÁTICA: Verificar e criar coluna comprador_id se necessário
    try {
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'boletos' 
        AND column_name = 'comprador_id'
      `);

      if (checkColumn.rowCount === 0) {
        console.log('🔧 [MIGRAÇÃO] Coluna comprador_id não existe. Executando migração...');
        
        await pool.query(`ALTER TABLE boletos ADD COLUMN comprador_id VARCHAR(255)`);
        await pool.query(`CREATE INDEX idx_boletos_comprador_id ON boletos(comprador_id)`);
        await pool.query(`CREATE INDEX idx_boletos_comprador_status ON boletos(comprador_id, status)`);
        await pool.query(`COMMENT ON COLUMN boletos.comprador_id IS 'ID do usuário comprador (Firebase UID)'`);
        
        console.log('✅ [MIGRAÇÃO] Coluna comprador_id criada com sucesso!');
      } else {
        console.log('✅ [MIGRAÇÃO] Coluna comprador_id já existe.');
      }

      // 🔄 MIGRAÇÃO DE DADOS: Migrar dados existentes
      const boletosParaMigrar = await pool.query(`
        SELECT id, wallet_address, status, user_id
        FROM boletos 
        WHERE wallet_address IS NOT NULL 
        AND wallet_address != ''
        AND comprador_id IS NULL
        AND status IN ('PENDENTE_PAGAMENTO', 'AGUARDANDO_BAIXA', 'BAIXADO')
      `);

      if (boletosParaMigrar.rowCount > 0) {
        console.log(`🔄 [MIGRAÇÃO DADOS] Migrando ${boletosParaMigrar.rowCount} boletos...`);
        
        for (const boleto of boletosParaMigrar.rows) {
          try {
            // Usar o user_id como comprador_id (assumindo que é o comprador)
            await pool.query(`
              UPDATE boletos 
              SET comprador_id = $1 
              WHERE id = $2
            `, [boleto.user_id, boleto.id]);
            
            console.log(`✅ [MIGRAÇÃO DADOS] Boleto ${boleto.id} migrado`);
          } catch (error) {
            console.error(`❌ [MIGRAÇÃO DADOS] Erro ao migrar boleto ${boleto.id}:`, error.message);
          }
        }
        
        console.log('✅ [MIGRAÇÃO DADOS] Migração de dados concluída!');
      } else {
        console.log('✅ [MIGRAÇÃO DADOS] Nenhum boleto precisa ser migrado.');
      }
      
    } catch (migrationError) {
      console.error('⚠️ [MIGRAÇÃO] Erro na migração:', migrationError.message);
      // Continuar mesmo com erro de migração
    }
    console.log(`🚀 API Boletos Request: ${req.method} ${req.url}`);
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request Headers:', req.headers);

    if (req.method === 'GET') {
      // DEBUG: Se for requisição de debug, retornar todos os boletos
      if (req.url.includes('debug=all')) {
        console.log('🔍 [DEBUG] Retornando TODOS os boletos...');
        const allBoletos = await pool.query('SELECT * FROM boletos ORDER BY criado_em DESC');
        
        res.status(200).json({
          success: true,
          data: allBoletos.rows,
          count: allBoletos.rowCount,
          debug: {
            timestamp: new Date().toISOString(),
            total_boletos: allBoletos.rowCount,
            aguardando_pagamento: allBoletos.rows.filter(b => b.status === 'AGUARDANDO_PAGAMENTO').length
          }
        });
        return;
      }
      
      // Verificar se é busca por número de controle via query parameter
      // Múltiplas estratégias para detectar o query parameter
      let numero_controle = null;
      
      // Estratégia 1: req.query (Vercel auto-parse)
      if (req.query && req.query.numero_controle) {
        numero_controle = req.query.numero_controle;
        console.log(`✅ Encontrado via req.query: ${numero_controle}`);
      }
      
      // Estratégia 2: Parse manual da URL
      if (!numero_controle && req.url && req.url.includes('numero_controle=')) {
        const match = req.url.match(/numero_controle=([^&]*)/);
        if (match) {
          numero_controle = decodeURIComponent(match[1]);
          console.log(`✅ Encontrado via regex: ${numero_controle}`);
        }
      }
      
      // Estratégia 3: URL objeto
      if (!numero_controle) {
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          numero_controle = url.searchParams.get('numero_controle');
          if (numero_controle) {
            console.log(`✅ Encontrado via URL object: ${numero_controle}`);
          }
        } catch (e) {
          console.log(`❌ Erro ao fazer parse da URL: ${e.message}`);
        }
      }
      
      console.log(`🔍 DEBUG URL: ${req.url}`);
      console.log(`🔍 DEBUG req.query:`, req.query);
      console.log(`🔍 DEBUG numero_controle FINAL: "${numero_controle}"`);
      
      if (numero_controle && numero_controle.trim().length > 0) {
        console.log(`🔍 Buscando boleto por numero_controle: ${numero_controle}`);
        
        // Buscar boleto específico por número de controle
        const result = await pool.query('SELECT * FROM boletos WHERE numero_controle = $1', [String(numero_controle)]);
        
        if (result.rowCount === 0) {
          console.log(`❌ Boleto não encontrado: ${numero_controle}`);
          return res.status(404).json({
            error: 'Boleto não encontrado',
            message: `Nenhum boleto encontrado com número de controle: ${numero_controle}`,
            numero_controle: numero_controle
          });
        }
        
        console.log(`✅ Boleto encontrado: ${numero_controle}`);
        return res.status(200).json({
          success: true,
          data: result.rows[0]
        });
      }
      
      // Buscar apenas boletos DISPONÍVEIS incluindo codigo_barras (ULTRA OTIMIZADO)
      const result = await pool.query(`
        SELECT id, numero_controle, codigo_barras, cpf_cnpj, valor_brl, valor_usdt, vencimento, instituicao, status, criado_em 
        FROM boletos 
        WHERE status = 'DISPONIVEL'
        ORDER BY criado_em DESC 
        LIMIT 15
      `);
      
      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });

    } else if (req.method === 'POST') {
      console.log('📝 INICIANDO PROCESSAMENTO POST...');
      
      // PRIMEIRO: Verificar estrutura da tabela
      console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA...');
      const tableInfo = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'boletos' ORDER BY ordinal_position");
      console.log('📍 Estrutura completa da tabela boletos:', tableInfo.rows);
      
      // Criar novo boleto
      const { 
        numero_controle, 
        valor, 
        valor_usdt, // ✅ Adicionar valor_usdt na desestruturação
        vencimento, 
        user_id, 
        descricao,
        codigo_barras,
        cpf_cnpj,
        instituicao,
        escrow_id, // ✅ Adicionar escrow_id
        tx_hash,   // ✅ Adicionar tx_hash
        data_travamento // ✅ Adicionar data_travamento
      } = req.body;

      console.log('📋 Dados recebidos:', {
        numero_controle,
        valor,
        valor_usdt, // ✅ Log do valor_usdt
        vencimento,
        user_id,
        descricao,
        codigo_barras,
        cpf_cnpj,
        instituicao,
        escrow_id, // ✅ Log do escrow_id
        tx_hash,   // ✅ Log do tx_hash
        data_travamento // ✅ Log da data_travamento
      });

      if (!numero_controle || !valor || !user_id) {
        console.log('❌ Validação falhou:', { numero_controle, valor, user_id });
        return res.status(400).json({
          error: 'Dados obrigatórios faltando',
          required: ['numero_controle', 'valor', 'user_id'],
          received: { numero_controle, valor, user_id }
        });
      }

      console.log('✅ Validação passou, formatando data...');

      // Formatar data de vencimento se fornecida (aceita DD/MM/YYYY ou YYYY-MM-DD)
      let dataVencimento = null;
      if (vencimento) {
        try {
          if (typeof vencimento === 'string') {
            if (vencimento.includes('/')) {
              // Formato DD/MM/YYYY → YYYY-MM-DD
              const [dia, mes, ano] = vencimento.split('/');
              dataVencimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            } else if (vencimento.includes('-')) {
              // Formato YYYY-MM-DD (input type=date)
              const [ano, mes, dia] = vencimento.split('-');
              dataVencimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            } else {
              // Tentar parse genérico
              const parsed = new Date(vencimento);
              if (!isNaN(parsed.getTime())) {
                dataVencimento = parsed.toISOString().split('T')[0];
              }
            }
          }
          console.log('📅 Data formatada:', dataVencimento);
        } catch (error) {
          console.warn('Erro ao formatar data de vencimento:', error);
        }
      } else {
        // Se não houver vencimento enviado, definir padrão de 30 dias após criação
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + 30);
        dataVencimento = hoje.toISOString().split('T')[0];
        console.log('📅 Vencimento padrão aplicado (30 dias):', dataVencimento);
      }

      console.log('💾 Inserindo no banco...');

      // O frontend já faz a conversão via CoinGecko, então usar o valor enviado
      const valorUSDT = req.body.valor_usdt && req.body.valor_usdt !== "" ? req.body.valor_usdt : valor; // ✅ CORRIGIDO: Verificar se valor_usdt existe e não é vazio
      
      console.log(`💰 Valor recebido: ${valor} BRL → ${valorUSDT} USDT (conversão feita no frontend)`);
      console.log(`🔍 Debug valor_usdt: "${req.body.valor_usdt}" (tipo: ${typeof req.body.valor_usdt})`);

      const result = await pool.query(
        `INSERT INTO boletos (
          numero_controle, valor_brl, valor_usdt, vencimento, user_id, 
          status, codigo_barras, cpf_cnpj, instituicao, criado_em,
          escrow_id, tx_hash, data_travamento
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12) RETURNING *`,
        [
          numero_controle, 
          valor, 
          valorUSDT, // Usar o valor USDT já convertido pelo frontend
          dataVencimento, 
          user_id, 
          'DISPONIVEL',
          codigo_barras || null,
          cpf_cnpj || null,
          instituicao || null,
          escrow_id || null,  // ✅ Adicionar escrow_id
          tx_hash || null,    // ✅ Adicionar tx_hash
          data_travamento || null // ✅ Adicionar data_travamento
        ]
      );

      console.log('✅ Boleto criado com sucesso:', result.rows[0]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto criado com sucesso'
      });

    } else if (req.method === 'PATCH' && req.url.includes('/fix-null-dates')) {
      // Endpoint para corrigir boletos com vencimento null
      console.log('🔧 Iniciando correção de datas null...');
      
      try {
        // Buscar boletos com vencimento null
        const nullDatesResult = await pool.query(
          'SELECT id, numero_controle, criado_em FROM boletos WHERE vencimento IS NULL'
        );
        
        console.log(`📊 Encontrados ${nullDatesResult.rowCount} boletos com vencimento null`);
        
        if (nullDatesResult.rowCount === 0) {
          return res.status(200).json({
            success: true,
            message: 'Nenhum boleto com vencimento null encontrado'
          });
        }
        
        let updatedCount = 0;
        
        for (const boleto of nullDatesResult.rows) {
          // Calcular vencimento padrão: 30 dias após criação
          const criadoEm = new Date(boleto.criado_em);
          const vencimento = new Date(criadoEm);
          vencimento.setDate(vencimento.getDate() + 30);
          
          console.log(`📅 Atualizando boleto ${boleto.numero_controle}: ${criadoEm.toISOString()} -> ${vencimento.toISOString()}`);
          
          const updateResult = await pool.query(
            'UPDATE boletos SET vencimento = $1 WHERE id = $2',
            [vencimento.toISOString().split('T')[0], boleto.id]
          );
          
          if (updateResult.rowCount > 0) {
            updatedCount++;
          }
        }
        
        console.log(`✅ ${updatedCount} boletos atualizados com sucesso`);
        
        res.status(200).json({
          success: true,
          message: `${updatedCount} boletos atualizados com vencimento padrão (30 dias)`,
          updated: updatedCount,
          total: nullDatesResult.rowCount
        });
        
      } catch (error) {
        console.error('❌ Erro ao corrigir datas null:', error);
        res.status(500).json({
          error: 'Erro interno do servidor',
          details: error.message
        });
      }

    } else if (req.method === 'PATCH' && req.url.includes('/fix-usdt-values')) {
      // Endpoint para corrigir valores USDT dos boletos antigos
      console.log('🔧 Iniciando correção de valores USDT...');
      
      try {
        // Buscar boletos onde valor_usdt = valor_brl (não convertidos)
        const uncorrectedResult = await pool.query(
          'SELECT id, numero_controle, valor_brl, valor_usdt FROM boletos WHERE valor_usdt = valor_brl'
        );
        
        console.log(`📊 Encontrados ${uncorrectedResult.rowCount} boletos com valores USDT não convertidos`);
        
        if (uncorrectedResult.rowCount === 0) {
          return res.status(200).json({
            success: true,
            message: 'Nenhum boleto com valores USDT não convertidos encontrado'
          });
        }
        
        let updatedCount = 0;
        
        for (const boleto of uncorrectedResult.rows) {
          // Taxa de conversão aproximada: 1 BRL = 0.18 USDT (baseado nos valores corretos)
          const valorBRL = parseFloat(boleto.valor_brl);
          const valorUSDT = valorBRL * 0.18;
          
          console.log(`💰 Convertendo boleto ${boleto.numero_controle}: ${valorBRL} BRL → ${valorUSDT.toFixed(2)} USDT`);
          
          const updateResult = await pool.query(
            'UPDATE boletos SET valor_usdt = $1 WHERE id = $2',
            [valorUSDT.toFixed(2), boleto.id]
          );
          
          if (updateResult.rowCount > 0) {
            updatedCount++;
          }
        }
        
        console.log(`✅ ${updatedCount} boletos atualizados com valores USDT corretos`);
        
        res.status(200).json({
          success: true,
          message: `${updatedCount} boletos atualizados com valores USDT convertidos`,
          updated: updatedCount,
          total: uncorrectedResult.rowCount
        });
        
      } catch (error) {
        console.error('❌ Erro ao corrigir valores USDT:', error);
        res.status(500).json({
          error: 'Erro interno do servidor',
          details: error.message
        });
      }

    } else {
      res.status(405).json({
        error: 'Método não permitido',
        method: req.method,
        allowed: ['GET', 'POST', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('❌ Erro na API Boletos:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
  }
};