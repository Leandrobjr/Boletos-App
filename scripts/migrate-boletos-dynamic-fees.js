/**
 * 🔄 SCRIPT DE MIGRAÇÃO - BOLETOS PARA TAXAS DINÂMICAS
 * 
 * Este script:
 * 1. Atualiza boletos existentes com campos de taxas dinâmicas
 * 2. Calcula taxas baseadas no tempo de criação
 * 3. Adiciona escrow_id para boletos que não possuem
 * 4. Cria temporizadores para boletos ativos
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Importar serviços de taxas dinâmicas
const { DynamicFeeServiceFactory } = require('../src/services/DynamicFeeService');
const { TimerServiceFactory } = require('../src/services/TimerService');

// Configuração
const STORAGE_FILE = path.join(__dirname, '..', 'boletos-storage.json');
const BACKUP_FILE = path.join(__dirname, '..', 'boletos-storage.backup.json');

// Inicializar serviços
const feeService = DynamicFeeServiceFactory.create();
const timerService = TimerServiceFactory.create();

/**
 * 🔧 Gerar escrow_id fictício para boletos sem escrow
 */
function generateEscrowId(boleto) {
  const crypto = require('crypto');
  const data = `${boleto.id}-${boleto.numero_controle}-${boleto.criado_em}`;
  return '0x' + crypto.createHash('sha256').update(data).digest('hex').substring(0, 64);
}

/**
 * 💰 Migrar boleto individual
 */
function migrateBoleto(boleto) {
  console.log(`\n🔄 Migrando boleto ${boleto.numero_controle}...`);
  
  try {
    // Calcular taxas dinâmicas baseadas no tempo de criação
    const creationTime = new Date(boleto.criado_em);
    const currentTime = new Date();
    
    const feeCalculation = feeService.calculateAllFees({
      boletoValue: boleto.valor,
      creationTime: creationTime,
      currentTime: currentTime
    });

    console.log(`💰 Taxas calculadas:`, {
      buyerFee: feeCalculation.buyerFee.amount,
      sellerFee: feeCalculation.sellerTransactionFee.finalFee,
      protocolEarns: feeCalculation.totals.protocolEarns
    });

    // Atualizar boleto com campos de taxas dinâmicas
    const updatedBoleto = {
      ...boleto,
      
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
      timer_status: 'MIGRATED',
      
      // ⏰ CAMPOS DE TEMPO
      migrated_at: currentTime.toISOString(),
      creation_timestamp: creationTime.getTime(),
      
      // 🔗 ESCROW ID (se não existir)
      escrow_id: boleto.escrow_id || generateEscrowId(boleto),
      
      // 🏷️ VERSÃO
      schema_version: '2.0.0'
    };

    // Criar temporizadores se o boleto estiver ativo
    if (['DISPONIVEL', 'PENDENTE_PAGAMENTO', 'AGUARDANDO_BAIXA'].includes(boleto.status)) {
      try {
        const timers = timerService.createTransactionTimers({
          id: boleto.numero_controle,
          numeroControle: boleto.numero_controle,
          creationTime: creationTime,
          valor: boleto.valor
        });
        
        console.log(`⏰ Criados ${timers.length} temporizadores`);
        updatedBoleto.timers_created = true;
      } catch (timerError) {
        console.warn(`⚠️  Erro ao criar temporizadores: ${timerError.message}`);
        updatedBoleto.timers_created = false;
      }
    }

    console.log(`✅ Boleto ${boleto.numero_controle} migrado com sucesso`);
    return updatedBoleto;

  } catch (error) {
    console.error(`❌ Erro ao migrar boleto ${boleto.numero_controle}:`, error);
    return {
      ...boleto,
      migration_error: error.message,
      schema_version: '1.0.0' // Manter versão antiga em caso de erro
    };
  }
}

/**
 * 🚀 Executar migração completa
 */
async function runMigration() {
  console.log('🚀 INICIANDO MIGRAÇÃO PARA TAXAS DINÂMICAS');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se arquivo existe
    if (!fs.existsSync(STORAGE_FILE)) {
      console.error('❌ Arquivo boletos-storage.json não encontrado!');
      process.exit(1);
    }

    // 2. Fazer backup
    console.log('💾 Criando backup...');
    const backupData = fs.readFileSync(STORAGE_FILE, 'utf8');
    fs.writeFileSync(BACKUP_FILE, backupData);
    console.log(`✅ Backup criado: ${BACKUP_FILE}`);

    // 3. Carregar boletos
    console.log('📂 Carregando boletos...');
    const boletos = JSON.parse(backupData);
    console.log(`📊 Encontrados ${boletos.length} boletos`);

    // 4. Analisar estado atual
    const statusCount = boletos.reduce((acc, boleto) => {
      acc[boleto.status] = (acc[boleto.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Status dos boletos:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    const boletosSemEscrow = boletos.filter(b => !b.escrow_id).length;
    const boletosSemTaxas = boletos.filter(b => !b.buyer_fee).length;
    
    console.log(`\n🔍 Análise de migração:`);
    console.log(`   Boletos sem escrow_id: ${boletosSemEscrow}`);
    console.log(`   Boletos sem taxas dinâmicas: ${boletosSemTaxas}`);

    // 5. Migrar boletos
    console.log('\n🔄 Iniciando migração...');
    const migratedBoletos = boletos.map(migrateBoleto);

    // 6. Salvar resultado
    console.log('\n💾 Salvando boletos migrados...');
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(migratedBoletos, null, 2));

    // 7. Estatísticas finais
    const sucessfulMigrations = migratedBoletos.filter(b => b.schema_version === '2.0.0').length;
    const failedMigrations = migratedBoletos.filter(b => b.migration_error).length;
    const timersCreated = migratedBoletos.filter(b => b.timers_created).length;

    console.log('\n📊 RESULTADO DA MIGRAÇÃO');
    console.log('=' .repeat(40));
    console.log(`✅ Migrações bem-sucedidas: ${sucessfulMigrations}`);
    console.log(`❌ Migrações com erro: ${failedMigrations}`);
    console.log(`⏰ Temporizadores criados: ${timersCreated}`);
    console.log(`💾 Backup salvo em: ${BACKUP_FILE}`);

    // 8. Verificar integridade
    console.log('\n🔍 Verificando integridade...');
    const verification = {
      totalBoletos: migratedBoletos.length,
      withEscrowId: migratedBoletos.filter(b => b.escrow_id).length,
      withDynamicFees: migratedBoletos.filter(b => b.buyer_fee !== undefined).length,
      withTimers: migratedBoletos.filter(b => b.timers_created).length
    };

    console.log('✅ Verificação concluída:', verification);

    // 9. Gerar relatório detalhado
    const report = {
      migration: {
        date: new Date().toISOString(),
        totalBoletos: boletos.length,
        successful: sucessfulMigrations,
        failed: failedMigrations,
        timersCreated: timersCreated
      },
      fees: {
        totalProtocolEarnings: migratedBoletos
          .filter(b => b.protocol_earnings)
          .reduce((sum, b) => sum + b.protocol_earnings, 0),
        avgBuyerFee: migratedBoletos
          .filter(b => b.buyer_fee)
          .reduce((sum, b) => sum + b.buyer_fee, 0) / sucessfulMigrations,
        avgSellerFee: migratedBoletos
          .filter(b => b.current_seller_fee)
          .reduce((sum, b) => sum + b.current_seller_fee, 0) / sucessfulMigrations
      },
      integrity: verification
    };

    // 10. Salvar relatório
    const reportFile = path.join(__dirname, '..', 'migration-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📋 Relatório salvo: ${reportFile}`);

    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    
    if (failedMigrations > 0) {
      console.log('\n⚠️  ATENÇÃO: Alguns boletos não puderam ser migrados completamente.');
      console.log('Verifique os logs acima para mais detalhes.');
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', error);
    
    // Restaurar backup em caso de erro crítico
    if (fs.existsSync(BACKUP_FILE)) {
      console.log('🔄 Restaurando backup...');
      const backupData = fs.readFileSync(BACKUP_FILE, 'utf8');
      fs.writeFileSync(STORAGE_FILE, backupData);
      console.log('✅ Backup restaurado');
    }
    
    process.exit(1);
  }
}

// 🚀 EXECUTAR MIGRAÇÃO
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { migrateBoleto, generateEscrowId, runMigration };

