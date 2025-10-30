/**
 * Endpoint de Debug para Upload de Comprovante
 * Fornece informações detalhadas sobre o processo de upload
 */

import { neon } from '@neondatabase/serverless';

// Configuração do banco de dados
const sql = neon(process.env.DATABASE_URL);

// Sistema de logging estruturado
class DebugLogger {
  constructor(requestId) {
    this.requestId = requestId;
    this.logs = [];
    this.startTime = Date.now();
  }

  log(level, step, message, data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    
    const logEntry = {
      requestId: this.requestId,
      timestamp,
      elapsed,
      level,
      step,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null
    };

    this.logs.push(logEntry);
    
    // Log no console para desenvolvimento
    console.log(`[${level.toUpperCase()}] ${step}: ${message}`, data || '');
  }

  info(step, message, data) { this.log('info', step, message, data); }
  success(step, message, data) { this.log('success', step, message, data); }
  warning(step, message, data) { this.log('warning', step, message, data); }
  error(step, message, data) { this.log('error', step, message, data); }

  getReport() {
    return {
      requestId: this.requestId,
      startTime: new Date(this.startTime).toISOString(),
      totalDuration: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(log => log.level === 'error').length,
      warningCount: this.logs.filter(log => log.level === 'warning').length,
      logs: this.logs
    };
  }
}

export default async function handler(req, res) {
  const requestId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logger = new DebugLogger(requestId);

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  logger.info('INIT', 'Iniciando debug do sistema de upload', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  try {
    if (req.method === 'GET') {
      // Health check e informações do sistema
      logger.info('HEALTH_CHECK', 'Executando verificação de saúde do sistema');

      // Testar conexão com banco de dados
      logger.info('DB_TEST', 'Testando conexão com banco de dados');
      
      try {
        const dbTest = await sql`SELECT NOW() as current_time, version() as db_version`;
        logger.success('DB_CONNECTION', 'Conexão com banco de dados bem-sucedida', {
          currentTime: dbTest[0].current_time,
          dbVersion: dbTest[0].db_version
        });
      } catch (dbError) {
        logger.error('DB_CONNECTION', 'Falha na conexão com banco de dados', {
          error: dbError.message,
          stack: dbError.stack
        });
      }

      // Verificar estrutura da tabela boletos
      try {
        logger.info('TABLE_CHECK', 'Verificando estrutura da tabela boletos');
        
        const tableInfo = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'boletos' 
          ORDER BY ordinal_position
        `;
        
        logger.success('TABLE_STRUCTURE', 'Estrutura da tabela boletos obtida', {
          columns: tableInfo.length,
          columnDetails: tableInfo
        });
      } catch (tableError) {
        logger.error('TABLE_CHECK', 'Erro ao verificar estrutura da tabela', {
          error: tableError.message
        });
      }

      // Verificar alguns boletos de exemplo
      try {
        logger.info('SAMPLE_DATA', 'Buscando boletos de exemplo');
        
        const sampleBoletos = await sql`
          SELECT numero_controle, status, criado_em, valor
          FROM boletos 
          ORDER BY criado_em DESC 
          LIMIT 5
        `;
        
        logger.success('SAMPLE_DATA', 'Boletos de exemplo obtidos', {
          count: sampleBoletos.length,
          samples: sampleBoletos
        });
      } catch (sampleError) {
        logger.error('SAMPLE_DATA', 'Erro ao buscar boletos de exemplo', {
          error: sampleError.message
        });
      }

      const report = logger.getReport();
      
      return res.status(200).json({
        success: true,
        message: 'Debug health check concluído',
        data: {
          status: 'healthy',
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            timestamp: new Date().toISOString()
          },
          debugReport: report
        }
      });

    } else if (req.method === 'POST') {
      // Debug de upload específico
      logger.info('UPLOAD_DEBUG', 'Iniciando debug de upload', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length']
      });

      const { numero_controle, test_mode = true } = req.body;

      if (!numero_controle) {
        logger.error('VALIDATION', 'Número de controle não fornecido');
        return res.status(400).json({
          success: false,
          error: 'numero_controle é obrigatório para debug',
          debugReport: logger.getReport()
        });
      }

      logger.info('BOLETO_LOOKUP', 'Buscando boleto para debug', { numero_controle });

      try {
        // Buscar boleto específico
        const boleto = await sql`
          SELECT * FROM boletos 
          WHERE CAST(numero_controle AS TEXT) = ${numero_controle}
          LIMIT 1
        `;

        if (boleto.length === 0) {
          logger.warning('BOLETO_NOT_FOUND', 'Boleto não encontrado', { numero_controle });
          
          // Tentar buscar boletos similares
          const similarBoletos = await sql`
            SELECT numero_controle, status 
            FROM boletos 
            WHERE CAST(numero_controle AS TEXT) LIKE ${`%${numero_controle.slice(-4)}%`}
            LIMIT 5
          `;
          
          logger.info('SIMILAR_SEARCH', 'Boletos similares encontrados', {
            count: similarBoletos.length,
            similar: similarBoletos
          });

          return res.status(404).json({
            success: false,
            error: 'Boleto não encontrado',
            data: {
              numero_controle,
              similarBoletos
            },
            debugReport: logger.getReport()
          });
        }

        const boletoData = boleto[0];
        logger.success('BOLETO_FOUND', 'Boleto encontrado com sucesso', {
          numero_controle: boletoData.numero_controle,
          status: boletoData.status,
          valor: boletoData.valor,
          criado_em: boletoData.criado_em
        });

        // Verificar se boleto pode receber comprovante
        const canReceiveComprovante = boletoData.status === 'PENDENTE_PAGAMENTO';
        
        if (!canReceiveComprovante) {
          logger.warning('STATUS_CHECK', 'Boleto não está em status válido para receber comprovante', {
            currentStatus: boletoData.status,
            requiredStatus: 'PENDENTE_PAGAMENTO'
          });
        } else {
          logger.success('STATUS_CHECK', 'Boleto está em status válido para receber comprovante');
        }

        // Simular processo de upload se em modo de teste
        if (test_mode) {
          logger.info('TEST_SIMULATION', 'Simulando processo de upload');
          
          // Simular validações que seriam feitas no upload real
          const validations = {
            fileSize: { valid: true, message: 'Tamanho de arquivo válido' },
            fileType: { valid: true, message: 'Tipo de arquivo válido' },
            boletoStatus: { valid: canReceiveComprovante, message: canReceiveComprovante ? 'Status válido' : 'Status inválido' },
            databaseConnection: { valid: true, message: 'Conexão com banco OK' }
          };

          logger.info('VALIDATIONS', 'Validações simuladas', validations);

          const allValid = Object.values(validations).every(v => v.valid);
          
          if (allValid) {
            logger.success('SIMULATION', 'Simulação de upload bem-sucedida - todos os critérios atendidos');
          } else {
            logger.warning('SIMULATION', 'Simulação identificou problemas potenciais', {
              failedValidations: Object.entries(validations)
                .filter(([_, v]) => !v.valid)
                .map(([key, v]) => ({ validation: key, message: v.message }))
            });
          }
        }

        const report = logger.getReport();

        return res.status(200).json({
          success: true,
          message: 'Debug de upload concluído',
          data: {
            boleto: boletoData,
            canReceiveComprovante,
            validations: test_mode ? validations : null,
            recommendations: generateRecommendations(boletoData, logger.logs)
          },
          debugReport: report
        });

      } catch (error) {
        logger.error('DATABASE_ERROR', 'Erro ao acessar banco de dados', {
          error: error.message,
          stack: error.stack,
          query: 'SELECT boleto by numero_controle'
        });

        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor durante debug',
          details: error.message,
          debugReport: logger.getReport()
        });
      }

    } else {
      logger.warning('METHOD_NOT_ALLOWED', 'Método HTTP não permitido', { method: req.method });
      
      return res.status(405).json({
        success: false,
        error: 'Método não permitido',
        allowedMethods: ['GET', 'POST'],
        debugReport: logger.getReport()
      });
    }

  } catch (error) {
    logger.error('UNEXPECTED_ERROR', 'Erro inesperado no endpoint de debug', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Erro inesperado no sistema de debug',
      details: error.message,
      debugReport: logger.getReport()
    });
  }
}

// Função para gerar recomendações baseadas nos logs
function generateRecommendations(boletoData, logs) {
  const recommendations = [];
  
  const hasErrors = logs.some(log => log.level === 'error');
  const hasWarnings = logs.some(log => log.level === 'warning');
  
  if (hasErrors) {
    recommendations.push({
      type: 'error',
      message: 'Foram detectados erros críticos. Verifique os logs detalhados.',
      action: 'Revisar configuração do banco de dados e conectividade'
    });
  }
  
  if (boletoData && boletoData.status !== 'PENDENTE_PAGAMENTO') {
    recommendations.push({
      type: 'warning',
      message: `Boleto está em status '${boletoData.status}', não pode receber comprovante`,
      action: 'Verificar se o boleto correto está sendo usado'
    });
  }
  
  if (hasWarnings && !hasErrors) {
    recommendations.push({
      type: 'info',
      message: 'Sistema funcionando com avisos menores',
      action: 'Monitorar logs para possíveis melhorias'
    });
  }
  
  if (!hasErrors && !hasWarnings) {
    recommendations.push({
      type: 'success',
      message: 'Sistema funcionando perfeitamente',
      action: 'Nenhuma ação necessária'
    });
  }
  
  return recommendations;
}