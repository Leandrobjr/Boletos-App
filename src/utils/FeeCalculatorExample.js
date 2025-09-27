/**
 * 📊 EXEMPLOS E TESTES - SISTEMA DE TAXAS DINÂMICAS
 * 
 * Demonstra como usar o sistema de taxas dinâmicas
 * com exemplos práticos e cenários de teste.
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

const { DynamicFeeServiceFactory } = require('../services/DynamicFeeService');
const { TimerServiceFactory } = require('../services/TimerService');

class FeeCalculatorExample {
  constructor() {
    this.feeService = DynamicFeeServiceFactory.create();
  }

  /**
   * 🎯 Exemplo 1: Boleto de R$ 50 (taxa fixa)
   */
  exemplo1_BoletoTaxaFixa() {
    console.log('\n🎯 EXEMPLO 1: Boleto R$ 50,00 (Taxa Fixa)');
    console.log('='.repeat(50));

    const calculation = this.feeService.calculateAllFees({
      boletoValue: 50.00,
      creationTime: new Date()
    });

    this.printFeeBreakdown(calculation);
    
    return calculation;
  }

  /**
   * 🎯 Exemplo 2: Boleto de R$ 500 (taxa percentual)
   */
  exemplo2_BoletoTaxaPercentual() {
    console.log('\n🎯 EXEMPLO 2: Boleto R$ 500,00 (Taxa Percentual)');
    console.log('='.repeat(50));

    const calculation = this.feeService.calculateAllFees({
      boletoValue: 500.00,
      creationTime: new Date()
    });

    this.printFeeBreakdown(calculation);
    
    return calculation;
  }

  /**
   * 🕐 Exemplo 3: Simulação de tempo - Taxa de transação
   */
  exemplo3_SimulacaoTempo() {
    console.log('\n🕐 EXEMPLO 3: Simulação de Tempo (R$ 200,00)');
    console.log('='.repeat(50));

    const boletoValue = 200.00;
    const creationTime = new Date();

    // Simular diferentes momentos
    const scenarios = [
      { hours: 0.5, description: '30 minutos após criação' },
      { hours: 1.5, description: '1.5 horas após criação' },
      { hours: 3, description: '3 horas após criação' },
      { hours: 12, description: '12 horas após criação' },
      { hours: 25, description: '25 horas após criação' },
      { hours: 36, description: '36 horas após criação' },
      { hours: 50, description: '50 horas após criação' },
      { hours: 74, description: '74 horas após criação' }
    ];

    scenarios.forEach(scenario => {
      const simulatedTime = new Date(creationTime.getTime() + (scenario.hours * 60 * 60 * 1000));
      
      const calculation = this.feeService.calculateAllFees({
        boletoValue,
        creationTime,
        currentTime: simulatedTime
      });

      console.log(`\n⏰ ${scenario.description}:`);
      console.log(`   Taxa vendedor: R$ ${calculation.sellerTransactionFee.finalFee.toFixed(2)}`);
      console.log(`   Devolução: R$ ${calculation.sellerTransactionFee.refundAmount.toFixed(2)} (${calculation.sellerTransactionFee.refundPercentage.toFixed(0)}%)`);
      console.log(`   Categoria: ${calculation.sellerTransactionFee.timeCategory}`);
    });

    return scenarios;
  }

  /**
   * 📊 Exemplo 4: Relatório completo de transação
   */
  exemplo4_RelatorioCompleto() {
    console.log('\n📊 EXEMPLO 4: Relatório Completo');
    console.log('='.repeat(50));

    const transaction = {
      id: 'BOLETO123456',
      boletoValue: 350.00,
      creationTime: new Date(Date.now() - (5 * 60 * 60 * 1000)), // 5 horas atrás
      status: 'AGUARDANDO_BAIXA'
    };

    const report = this.feeService.generateTransactionReport(transaction);
    
    console.log('📋 DADOS DA TRANSAÇÃO:');
    console.log(`   ID: ${report.transactionId}`);
    console.log(`   Status: ${report.status}`);
    console.log(`   Criado em: ${report.createdAt.toLocaleString('pt-BR')}`);
    console.log(`   Calculado em: ${report.calculatedAt.toLocaleString('pt-BR')}`);

    console.log('\n💰 CÁLCULOS DE TAXA:');
    this.printFeeBreakdown(report.calculation);

    console.log('\n💡 RECOMENDAÇÕES:');
    report.recommendations.forEach(rec => {
      const icon = this.getRecommendationIcon(rec.type);
      console.log(`   ${icon} ${rec.message}`);
    });

    return report;
  }

  /**
   * ⚡ Exemplo 5: Teste de performance
   */
  exemplo5_TestePerformance() {
    console.log('\n⚡ EXEMPLO 5: Teste de Performance');
    console.log('='.repeat(50));

    const iterations = 1000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      this.feeService.calculateAllFees({
        boletoValue: Math.random() * 1000,
        creationTime: new Date(Date.now() - (Math.random() * 72 * 60 * 60 * 1000))
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;

    console.log(`📊 Resultados do teste:`);
    console.log(`   Iterações: ${iterations}`);
    console.log(`   Tempo total: ${duration}ms`);
    console.log(`   Tempo médio: ${avgTime.toFixed(2)}ms por cálculo`);
    console.log(`   Throughput: ${(iterations / (duration / 1000)).toFixed(0)} cálculos/segundo`);

    return { iterations, duration, avgTime };
  }

  /**
   * 🎲 Exemplo 6: Cenários aleatórios
   */
  exemplo6_CenariosAleatorios() {
    console.log('\n🎲 EXEMPLO 6: Cenários Aleatórios');
    console.log('='.repeat(50));

    const scenarios = 5;

    for (let i = 1; i <= scenarios; i++) {
      const boletoValue = Math.round((Math.random() * 950 + 50) * 100) / 100;
      const hoursAgo = Math.random() * 96; // até 96 horas atrás
      const creationTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));

      const calculation = this.feeService.calculateAllFees({
        boletoValue,
        creationTime
      });

      console.log(`\n🎲 Cenário ${i}:`);
      console.log(`   Valor: R$ ${boletoValue.toFixed(2)}`);
      console.log(`   Criado há: ${hoursAgo.toFixed(1)} horas`);
      console.log(`   Taxa comprador: R$ ${calculation.buyerFee.amount.toFixed(2)} (${calculation.buyerFee.type})`);
      console.log(`   Taxa vendedor: R$ ${calculation.sellerTransactionFee.finalFee.toFixed(2)}`);
      console.log(`   Protocolo ganha: R$ ${calculation.totals.protocolEarns.toFixed(2)}`);
    }
  }

  /**
   * 📊 Imprime breakdown detalhado das taxas
   * @param {object} calculation - Cálculo de taxas
   */
  printFeeBreakdown(calculation) {
    console.log('\n💰 BREAKDOWN DE TAXAS:');
    console.log(`   Valor do boleto: R$ ${calculation.boletoValue.toFixed(2)}`);
    
    console.log('\n👤 COMPRADOR:');
    console.log(`   Taxa: R$ ${calculation.buyerFee.amount.toFixed(2)} (${calculation.buyerFee.type})`);
    console.log(`   Total a pagar: R$ ${calculation.totals.buyerPays.toFixed(2)}`);
    
    console.log('\n🏪 VENDEDOR:');
    console.log(`   Taxa base: R$ ${calculation.sellerTransactionFee.baseFee.toFixed(2)} (2%)`);
    console.log(`   Devolução: R$ ${calculation.sellerTransactionFee.refundAmount.toFixed(2)} (${calculation.sellerTransactionFee.refundPercentage.toFixed(0)}%)`);
    console.log(`   Taxa final: R$ ${calculation.sellerTransactionFee.finalFee.toFixed(2)}`);
    console.log(`   Recebe: R$ ${calculation.totals.sellerReceives.toFixed(2)}`);
    
    console.log('\n🏦 PROTOCOLO:');
    console.log(`   Total ganho: R$ ${calculation.totals.protocolEarns.toFixed(2)}`);
    console.log(`   Taxa comprador: R$ ${calculation.breakdown.buyerFeeToProtocol.toFixed(2)}`);
    console.log(`   Taxa vendedor: R$ ${calculation.breakdown.sellerFeeToProtocol.toFixed(2)}`);

    console.log('\n⏰ TEMPO:');
    console.log(`   Decorrido: ${calculation.timerStatus.elapsedHours.toFixed(1)} horas`);
    console.log(`   Categoria: ${calculation.sellerTransactionFee.timeCategory}`);
    console.log(`   Deadline upload: ${calculation.timerStatus.uploadDeadlinePassed ? '❌ Expirado' : '✅ Válido'}`);
    console.log(`   Auto release: ${calculation.timerStatus.shouldAutoRelease ? '🔄 Necessário' : '⏳ Pendente'}`);
  }

  /**
   * 📝 Obtém ícone para tipo de recomendação
   * @param {string} type - Tipo da recomendação
   * @returns {string} Ícone
   */
  getRecommendationIcon(type) {
    const icons = {
      'SUCCESS': '✅',
      'INFO': 'ℹ️',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'CRITICAL': '🚨'
    };
    return icons[type] || '📋';
  }

  /**
   * 🏃 Executa todos os exemplos
   */
  runAllExamples() {
    console.log('\n🚀 EXECUTANDO TODOS OS EXEMPLOS - SISTEMA DE TAXAS DINÂMICAS');
    console.log('='.repeat(70));

    try {
      this.exemplo1_BoletoTaxaFixa();
      this.exemplo2_BoletoTaxaPercentual();
      this.exemplo3_SimulacaoTempo();
      this.exemplo4_RelatorioCompleto();
      this.exemplo5_TestePerformance();
      this.exemplo6_CenariosAleatorios();

      console.log('\n✅ TODOS OS EXEMPLOS EXECUTADOS COM SUCESSO!');
      console.log('='.repeat(70));

    } catch (error) {
      console.error('\n❌ ERRO NA EXECUÇÃO DOS EXEMPLOS:', error);
    }
  }
}

// 🎯 Exemplo de uso do TimerService
class TimerServiceExample {
  constructor() {
    this.timerService = TimerServiceFactory.create();
    this.setupExampleListeners();
  }

  setupExampleListeners() {
    this.timerService.on('upload_deadline_reached', (event) => {
      console.log(`⏰ TIMER EVENT: Upload deadline para ${event.transaction.numeroControle}`);
    });

    this.timerService.on('auto_release_due', (event) => {
      console.log(`🔄 TIMER EVENT: Auto release para ${event.transaction.numeroControle}`);
    });
  }

  exemploTimerCompleto() {
    console.log('\n⏰ EXEMPLO: SISTEMA DE TIMERS');
    console.log('='.repeat(50));

    // Criar transação exemplo
    const transaction = {
      id: 'TEST123',
      numeroControle: 'TEST123',
      creationTime: new Date()
    };

    // Criar timers
    const timers = this.timerService.createTransactionTimers(transaction);
    
    console.log(`✅ ${timers.length} timers criados`);

    // Verificar status
    setTimeout(() => {
      const status = this.timerService.getTransactionTimerStatus('TEST123');
      console.log('📊 Status dos timers:', status);
      
      // Cancelar timers para limpeza
      this.timerService.cancelTransactionTimers('TEST123');
    }, 1000);
  }
}

// 🚀 Auto-execução se chamado diretamente
if (require.main === module) {
  console.log('🎯 INICIANDO EXEMPLOS DO SISTEMA DE TAXAS DINÂMICAS...\n');
  
  const examples = new FeeCalculatorExample();
  examples.runAllExamples();
  
  const timerExamples = new TimerServiceExample();
  timerExamples.exemploTimerCompleto();
}

module.exports = {
  FeeCalculatorExample,
  TimerServiceExample
};

