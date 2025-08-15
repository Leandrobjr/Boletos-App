const { Pool } = require('pg');

// Configuração do banco usando variáveis separadas (evita fallback para localhost)
const dbHost = process.env.DB_HOST || 'ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_dPQtsIq53OVc';
const dbName = process.env.DB_NAME || 'neondb';

const pool = new Pool({
  connectionString: `postgresql://${dbUser}:${dbPass}@${dbHost}/${dbName}?sslmode=require&channel_binding=require`,
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

    // Parse de URL e query
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const op = urlObj.searchParams.get('op');

    if (req.method === 'GET') {
      // Verificar se está buscando por numero_controle específico
      const numeroControle = urlObj.searchParams.get('numero_controle');
      
      if (numeroControle) {
        console.log(`🔍 Buscando boleto por numero_controle: ${numeroControle}`);
        const result = await pool.query('SELECT * FROM boletos WHERE numero_controle = $1', [numeroControle]);
        
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
      
      // Buscar todos os boletos
      const result = await pool.query('SELECT * FROM boletos ORDER BY criado_em DESC');
      
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

    } else if (req.method === 'PATCH' && (req.url.includes('/fix-null-dates') || op === 'fix-null-dates')) {
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

    } else if (req.method === 'PATCH' && (req.url.includes('/fix-usdt-values') || op === 'fix-usdt-values')) {
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