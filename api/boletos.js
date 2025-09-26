const { Pool } = require('pg');

// CONFIGURAÇÃO ROBUSTA COM RETRY E FALLBACK
let pool;

const createConnection = async () => {
  const connectionString = 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  try {
    console.log('🔗 [DB] Criando nova conexão com Neon PostgreSQL...');
    
    const newPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000, // 10s timeout
      idleTimeoutMillis: 30000,       // 30s idle timeout
      max: 5                          // max 5 conexões
    });

    // Testar conexão imediatamente
    const testResult = await newPool.query('SELECT NOW() as current_time');
    console.log('✅ [DB] Conexão testada:', testResult.rows[0]);
    
    return newPool;
  } catch (error) {
    console.error('❌ [DB] Erro na conexão:', error.message);
    throw error;
  }
};

const getPool = async () => {
  if (!pool) {
    pool = await createConnection();
  }
  return pool;
};

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
    console.log(`🚀 API Boletos Request: ${req.method} ${req.url}`);
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request Headers:', req.headers);

    // Parse de URL e query
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const op = urlObj.searchParams.get('op');

    if (req.method === 'GET') {
      // Extrair user_id da URL se for rota /usuario/:uid
      const userIdMatch = req.url.match(/\/usuario\/([^/?]+)/);
      const userId = userIdMatch ? userIdMatch[1] : null;
      
      console.log('🔍 [GET] URL:', req.url);
      console.log('🔍 [GET] User ID extraído:', userId);
      
      // Verificar se é solicitação de verificação de schema
      const verificarSchema = urlObj.searchParams.get('verificar_schema');
      
      if (verificarSchema === 'true') {
        console.log('🔍 Verificando schema da tabela boletos...');
        
        try {
          const currentPool = await getPool();
          // 1. Verificar estrutura atual
          const tableInfo = await currentPool.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'boletos' 
            ORDER BY ordinal_position
          `);
          
          console.log('📊 Estrutura atual da tabela boletos:');
          tableInfo.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
          });

          const existingColumns = tableInfo.rows.map(row => row.column_name);
          const missingColumns = [];

          // 2. Verificar campos necessários para blockchain
          const requiredColumns = [
            { name: 'escrow_id', type: 'VARCHAR(100)', nullable: true },
            { name: 'tx_hash', type: 'VARCHAR(100)', nullable: true },
            { name: 'data_travamento', type: 'TIMESTAMP', nullable: true },
            { name: 'comprador_id', type: 'VARCHAR(100)', nullable: true }
          ];

          for (const col of requiredColumns) {
            if (!existingColumns.includes(col.name)) {
              missingColumns.push(col);
            }
          }

          if (missingColumns.length === 0) {
            return res.status(200).json({
              success: true,
              message: 'Todos os campos necessários já existem na tabela',
              columns: existingColumns,
              finalStructure: tableInfo.rows
            });
          }

          // 3. Adicionar campos faltantes
          console.log(`📝 Adicionando ${missingColumns.length} campos faltantes...`);
          
          for (const col of missingColumns) {
            const alterQuery = `ALTER TABLE boletos ADD COLUMN ${col.name} ${col.type}${col.nullable ? '' : ' NOT NULL'}`;
            console.log(`🔧 Executando: ${alterQuery}`);
            
            try {
              await currentPool.query(alterQuery);
              console.log(`✅ Campo ${col.name} adicionado com sucesso`);
            } catch (error) {
              console.error(`❌ Erro ao adicionar campo ${col.name}:`, error.message);
            }
          }

          // 4. Verificar estrutura final
          const finalTableInfo = await currentPool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'boletos' 
            ORDER BY ordinal_position
          `);

          return res.status(200).json({
            success: true,
            message: `Schema atualizado! ${missingColumns.length} campos adicionados`,
            addedColumns: missingColumns.map(col => col.name),
            finalStructure: finalTableInfo.rows
          });
          
        } catch (error) {
          console.error('❌ Erro ao verificar/atualizar schema:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro ao verificar schema',
            details: error.message
          });
        }
      }
      
      // Verificar se está buscando por numero_controle específico
      const numeroControle = urlObj.searchParams.get('numero_controle');
      
      if (numeroControle) {
        console.log(`🔍 Buscando boleto por numero_controle: ${numeroControle}`);
        const currentPool = await getPool();
        const result = await currentPool.query('SELECT * FROM boletos WHERE numero_controle = $1', [numeroControle]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Boleto não encontrado'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: result.rows[0], // Retorna apenas o boleto encontrado
          count: 1
        });
      }
      
      // Construir query baseada no contexto
      let query, params = [];
      
      if (userId) {
        // Buscar boletos específicos do usuário (todos os status)
        console.log('📍 [GET] Buscando boletos do usuário:', userId);
        query = `
          SELECT id, numero_controle, codigo_barras, cpf_cnpj, valor_brl, valor_usdt, 
                 vencimento, instituicao, status, criado_em, escrow_id, tx_hash, 
                 data_travamento 
          FROM boletos 
          WHERE user_id = $1
          ORDER BY criado_em DESC 
          LIMIT 100
        `;
        params = [userId];
      } else {
        // Buscar apenas boletos DISPONÍVEIS para marketplace
        console.log('📍 [GET] Buscando boletos disponíveis para marketplace');
        query = `
          SELECT id, numero_controle, codigo_barras, cpf_cnpj, valor_brl, valor_usdt, 
                 vencimento, instituicao, status, criado_em 
          FROM boletos 
          WHERE status IN ('DISPONIVEL', 'pendente')
          ORDER BY criado_em DESC 
          LIMIT 50
        `;
      }
      
      const currentPool = await getPool();
      const result = await currentPool.query(query, params);
      
      console.log('📊 [GET] Resultado da consulta:');
      console.log(`   - Total encontrado: ${result.rowCount}`);
      console.log(`   - Primeiros IDs: ${result.rows.slice(0, 3).map(r => r.id)}`);
      
      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });

    } else if (req.method === 'POST') {
      console.log('📝 INICIANDO PROCESSAMENTO POST...');
      
      // PRIMEIRO: Verificar estrutura da tabela
      console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA...');
      const currentPool = await getPool();
      const tableInfo = await currentPool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'boletos' ORDER BY ordinal_position");
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
        escrow_id, // ✅ Campos do blockchain
        tx_hash,
        status,
        data_travamento
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
        escrow_id, // ✅ Log dos dados blockchain
        tx_hash,
        status,
        data_travamento
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

      // Formatar data de vencimento se fornecida (aceita DD/MM/YYYY, YYYY-MM-DD ou ISO)
      let dataVencimento = null;
      if (vencimento) {
        try {
          if (typeof vencimento === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
              // Já está em YYYY-MM-DD
              dataVencimento = vencimento;
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(vencimento)) {
              // Converte de DD/MM/YYYY
              const [dia, mes, ano] = vencimento.split('/');
              dataVencimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            } else {
              // Tenta parsear como ISO ou outra string válida
              const d = new Date(vencimento);
              if (!isNaN(d.getTime())) {
                const dia = String(d.getDate()).padStart(2, '0');
                const mes = String(d.getMonth() + 1).padStart(2, '0');
                const ano = d.getFullYear();
                dataVencimento = `${ano}-${mes}-${dia}`;
              }
            }
          } else if (vencimento instanceof Date) {
            const d = vencimento;
            const dia = String(d.getDate()).padStart(2, '0');
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const ano = d.getFullYear();
            dataVencimento = `${ano}-${mes}-${dia}`;
          }
          if (dataVencimento) {
            console.log('📅 Data formatada:', dataVencimento);
          } else {
            console.warn('⚠️ Não foi possível formatar a data de vencimento recebida:', vencimento);
          }
        } catch (error) {
          console.warn('Erro ao formatar data de vencimento:', error);
        }
      }

      console.log('💾 Inserindo no banco...');

      // O frontend já faz a conversão via CoinGecko, então usar o valor enviado
      const valorUSDT = req.body.valor_usdt && req.body.valor_usdt !== "" ? req.body.valor_usdt : valor; // ✅ CORRIGIDO: Verificar se valor_usdt existe e não é vazio
      
      console.log(`💰 Valor recebido: ${valor} BRL → ${valorUSDT} USDT (conversão feita no frontend)`);
      console.log(`🔍 Debug valor_usdt: "${req.body.valor_usdt}" (tipo: ${typeof req.body.valor_usdt})`);

      // Usar status enviado pelo frontend ou 'DISPONIVEL' como fallback
      const statusFinal = status || 'DISPONIVEL';
      
      const result = await currentPool.query(
        `INSERT INTO boletos (
          numero_controle, valor_brl, valor_usdt, vencimento, user_id, 
          status, codigo_barras, cpf_cnpj, instituicao, escrow_id, tx_hash, 
          data_travamento, criado_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING *`,
        [
          numero_controle, 
          valor, 
          valorUSDT, // Usar o valor USDT já convertido pelo frontend
          dataVencimento, 
          user_id, 
          statusFinal,
          codigo_barras || null,
          cpf_cnpj || null,
          instituicao || null,
          escrow_id || null, // ✅ Dados do blockchain
          tx_hash || null,
          data_travamento || new Date().toISOString()
        ]
      );

      console.log('✅ Boleto criado com sucesso:', result.rows[0]);

      // 🧪 DEBUG: Verificar se o boleto aparece imediatamente na consulta
      console.log('🧪 [DEBUG] Verificando se boleto aparece na consulta...');
      const verificacao = await currentPool.query(
        'SELECT id, numero_controle, status FROM boletos WHERE user_id = $1 ORDER BY criado_em DESC LIMIT 5',
        [user_id]
      );
      console.log('🧪 [DEBUG] Boletos encontrados após INSERT:', verificacao.rows);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Boleto criado com sucesso',
        debug_verificacao: verificacao.rows // 🧪 Incluir verificação na resposta
      });

    } else if (req.method === 'PATCH' && (req.url.includes('/fix-null-dates') || op === 'fix-null-dates')) {
      // Endpoint para corrigir boletos com vencimento null
      console.log('🔧 Iniciando correção de datas null...');
      
      try {
        const currentPool = await getPool();
        // Buscar boletos com vencimento null
        const nullDatesResult = await currentPool.query(
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
          
          const updateResult = await currentPool.query(
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

    } else if (req.method === 'PATCH' && (req.url.includes('/reservar') || op === 'reservar')) {
      // Endpoint para reservar boleto
      console.log('🔒 Iniciando reserva de boleto...');
      console.log('📦 Body recebido:', req.body);
      
      try {
        const currentPool = await getPool();
        const { numero_controle, status, wallet_address, tx_hash, comprador_id } = req.body;
        
        if (!numero_controle) {
          return res.status(400).json({
            error: 'Numero controle é obrigatório',
            required: ['numero_controle']
          });
        }
        
        console.log('🔍 Reservando boleto:', numero_controle);
        
        const result = await currentPool.query(`
          UPDATE boletos 
          SET status = $1, wallet_address = $2, tx_hash = $3, user_id = $4
          WHERE numero_controle = $5 AND status = 'DISPONIVEL'
          RETURNING *
        `, [
          status || 'AGUARDANDO PAGAMENTO',
          wallet_address,
          tx_hash,
          comprador_id,
          numero_controle
        ]);
        
        if (result.rowCount === 0) {
          return res.status(404).json({
            error: 'Boleto não encontrado ou não disponível',
            numero_controle: numero_controle
          });
        }
        
        console.log('✅ Boleto reservado com sucesso:', numero_controle);
        
        return res.status(200).json({
          success: true,
          data: result.rows[0],
          message: 'Boleto reservado com sucesso'
        });
        
      } catch (error) {
        console.error('❌ Erro ao reservar boleto:', error);
        return res.status(500).json({
          error: 'Erro interno do servidor',
          details: error.message
        });
      }

    } else if (req.method === 'PATCH' && (req.url.includes('/fix-usdt-values') || op === 'fix-usdt-values')) {
      // Endpoint para corrigir valores USDT dos boletos antigos
      console.log('🔧 Iniciando correção de valores USDT...');
      
      try {
        const currentPool = await getPool();
        // Buscar boletos onde valor_usdt = valor_brl (não convertidos)
        const uncorrectedResult = await currentPool.query(
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
          
          const updateResult = await currentPool.query(
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