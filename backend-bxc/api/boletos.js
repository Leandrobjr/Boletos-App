const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
    console.log(`🚀 API Boletos Request: ${req.method} ${req.url}`);
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request Headers:', req.headers);

    if (req.method === 'GET') {
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
      
      // Buscar apenas boletos DISPONÍVEIS incluindo codigo_barras (OTIMIZADO)
      const result = await pool.query(`
        SELECT id, numero_controle, codigo_barras, cpf_cnpj, valor_brl, valor_usdt, vencimento, instituicao, status, criado_em 
        FROM boletos 
        WHERE status IN ('DISPONIVEL', 'pendente')
        ORDER BY criado_em DESC 
        LIMIT 25
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
        instituicao
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
        instituicao
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

      // Formatar data de vencimento se fornecida
      let dataVencimento = null;
      if (vencimento) {
        try {
          // Converter de DD/MM/YYYY para YYYY-MM-DD
          const [dia, mes, ano] = vencimento.split('/');
          dataVencimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          console.log('📅 Data formatada:', dataVencimento);
        } catch (error) {
          console.warn('Erro ao formatar data de vencimento:', error);
        }
      }

      console.log('💾 Inserindo no banco...');

      // O frontend já faz a conversão via CoinGecko, então usar o valor enviado
      const valorUSDT = req.body.valor_usdt && req.body.valor_usdt !== "" ? req.body.valor_usdt : valor; // ✅ CORRIGIDO: Verificar se valor_usdt existe e não é vazio
      
      console.log(`💰 Valor recebido: ${valor} BRL → ${valorUSDT} USDT (conversão feita no frontend)`);
      console.log(`🔍 Debug valor_usdt: "${req.body.valor_usdt}" (tipo: ${typeof req.body.valor_usdt})`);

      const result = await pool.query(
        `INSERT INTO boletos (
          numero_controle, valor_brl, valor_usdt, vencimento, user_id, 
          status, codigo_barras, cpf_cnpj, instituicao, criado_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
        [
          numero_controle, 
          valor, 
          valorUSDT, // Usar o valor USDT já convertido pelo frontend
          dataVencimento, 
          user_id, 
          'DISPONIVEL',
          codigo_barras || null,
          cpf_cnpj || null,
          instituicao || null
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