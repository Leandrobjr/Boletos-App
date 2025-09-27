/**
 * 🏦 SISTEMA DE TAXAS DINÂMICAS - BoletoXCrypto
 * 
 * Implementa todas as regras de cobrança conforme especificações:
 * - Taxa do comprador (R$ 5 até R$ 100, 4% acima)
 * - Taxa de transação baseada em tempo para vendedor
 * - Temporizadores automáticos
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

class DynamicFeeService {
  constructor() {
    // Configurações das taxas
    this.BUYER_FEE_FIXED = 5.00; // R$ 5,00
    this.BUYER_FEE_THRESHOLD = 100.00; // R$ 100,00
    this.BUYER_FEE_PERCENTAGE = 0.04; // 4%
    this.SELLER_TRANSACTION_FEE = 0.02; // 2%
    
    // Marcos de tempo (em horas)
    this.TIME_MILESTONES = {
      UPLOAD_DEADLINE: 1, // 1 hora para upload
      FULL_REFUND: 2, // até 2h: 100% devolvida
      HALF_REFUND: 24, // 2h-24h: 50% devolvida
      QUARTER_REFUND: 48, // 24h-48h: 25% devolvida
      AUTO_RELEASE: 72 // 72h: baixa automática
    };
    
    // Percentuais de devolução da taxa de transação
    this.REFUND_PERCENTAGES = {
      FULL: 1.00, // 100%
      HALF: 0.50, // 50%
      QUARTER: 0.25, // 25%
      NONE: 0.00 // 0%
    };
  }

  /**
   * 💰 Calcula a taxa do comprador
   * @param {number} boletoValue - Valor do boleto em R$
   * @returns {object} Detalhes da taxa do comprador
   */
  calculateBuyerFee(boletoValue) {
    const value = parseFloat(boletoValue);
    
    if (value <= this.BUYER_FEE_THRESHOLD) {
      return {
        type: 'FIXED',
        amount: this.BUYER_FEE_FIXED,
        percentage: (this.BUYER_FEE_FIXED / value) * 100,
        description: `Taxa fixa de R$ ${this.BUYER_FEE_FIXED.toFixed(2)} para boletos até R$ ${this.BUYER_FEE_THRESHOLD.toFixed(2)}`
      };
    } else {
      const feeAmount = value * this.BUYER_FEE_PERCENTAGE;
      return {
        type: 'PERCENTAGE',
        amount: feeAmount,
        percentage: this.BUYER_FEE_PERCENTAGE * 100,
        description: `Taxa de ${(this.BUYER_FEE_PERCENTAGE * 100).toFixed(1)}% para boletos acima de R$ ${this.BUYER_FEE_THRESHOLD.toFixed(2)}`
      };
    }
  }

  /**
   * ⏱️ Calcula a taxa de transação do vendedor baseada no tempo
   * @param {number} boletoValue - Valor do boleto em R$
   * @param {Date} creationTime - Momento da criação da transação
   * @param {Date} currentTime - Momento atual (opcional, usa Date.now())
   * @returns {object} Detalhes da taxa de transação
   */
  calculateSellerTransactionFee(boletoValue, creationTime, currentTime = new Date()) {
    const value = parseFloat(boletoValue);
    const baseTransactionFee = value * this.SELLER_TRANSACTION_FEE;
    
    const elapsedHours = this.getElapsedHours(creationTime, currentTime);
    const refundInfo = this.getRefundInfo(elapsedHours);
    
    const refundAmount = baseTransactionFee * refundInfo.percentage;
    const finalFee = baseTransactionFee - refundAmount;
    
    return {
      baseFee: baseTransactionFee,
      elapsedHours: elapsedHours,
      refundPercentage: refundInfo.percentage * 100,
      refundAmount: refundAmount,
      finalFee: finalFee,
      description: refundInfo.description,
      timeCategory: refundInfo.category
    };
  }

  /**
   * 🕐 Calcula horas decorridas entre dois momentos
   * @param {Date} startTime - Momento inicial
   * @param {Date} endTime - Momento final
   * @returns {number} Horas decorridas
   */
  getElapsedHours(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  /**
   * 📊 Determina informações de devolução baseado no tempo decorrido
   * @param {number} elapsedHours - Horas decorridas
   * @returns {object} Informações de devolução
   */
  getRefundInfo(elapsedHours) {
    if (elapsedHours <= this.TIME_MILESTONES.FULL_REFUND) {
      return {
        category: 'FULL_REFUND',
        percentage: this.REFUND_PERCENTAGES.FULL,
        description: 'Até 2h: 100% da taxa devolvida'
      };
    } else if (elapsedHours <= this.TIME_MILESTONES.HALF_REFUND) {
      return {
        category: 'HALF_REFUND',
        percentage: this.REFUND_PERCENTAGES.HALF,
        description: '2h-24h: 50% da taxa devolvida'
      };
    } else if (elapsedHours <= this.TIME_MILESTONES.QUARTER_REFUND) {
      return {
        category: 'QUARTER_REFUND',
        percentage: this.REFUND_PERCENTAGES.QUARTER,
        description: '24h-48h: 25% da taxa devolvida'
      };
    } else {
      return {
        category: 'NO_REFUND',
        percentage: this.REFUND_PERCENTAGES.NONE,
        description: 'Após 48h: 0% da taxa devolvida'
      };
    }
  }

  /**
   * ⏰ Verifica status dos temporizadores
   * @param {Date} creationTime - Momento da criação
   * @param {Date} currentTime - Momento atual
   * @returns {object} Status dos temporizadores
   */
  checkTimerStatus(creationTime, currentTime = new Date()) {
    const elapsedHours = this.getElapsedHours(creationTime, currentTime);
    
    return {
      elapsedHours: elapsedHours,
      uploadDeadlinePassed: elapsedHours > this.TIME_MILESTONES.UPLOAD_DEADLINE,
      shouldAutoRelease: elapsedHours >= this.TIME_MILESTONES.AUTO_RELEASE,
      timeRemaining: {
        untilUploadDeadline: Math.max(0, this.TIME_MILESTONES.UPLOAD_DEADLINE - elapsedHours),
        untilAutoRelease: Math.max(0, this.TIME_MILESTONES.AUTO_RELEASE - elapsedHours)
      },
      milestones: {
        uploadDeadline: this.TIME_MILESTONES.UPLOAD_DEADLINE,
        autoRelease: this.TIME_MILESTONES.AUTO_RELEASE
      }
    };
  }

  /**
   * 💸 Calcula todas as taxas de uma transação
   * @param {object} params - Parâmetros da transação
   * @returns {object} Cálculo completo de taxas
   */
  calculateAllFees(params) {
    const {
      boletoValue,
      creationTime,
      currentTime = new Date()
    } = params;

    const buyerFee = this.calculateBuyerFee(boletoValue);
    const sellerTransactionFee = this.calculateSellerTransactionFee(boletoValue, creationTime, currentTime);
    const timerStatus = this.checkTimerStatus(creationTime, currentTime);

    const totalBuyerCost = parseFloat(boletoValue) + buyerFee.amount;
    const sellerReceives = parseFloat(boletoValue) - sellerTransactionFee.finalFee;
    const protocolEarns = buyerFee.amount + sellerTransactionFee.finalFee;

    return {
      boletoValue: parseFloat(boletoValue),
      buyerFee: buyerFee,
      sellerTransactionFee: sellerTransactionFee,
      timerStatus: timerStatus,
      totals: {
        buyerPays: totalBuyerCost,
        sellerReceives: sellerReceives,
        protocolEarns: protocolEarns,
        buyerRefund: 0 // Comprador não recebe devolução
      },
      breakdown: {
        boletoValueToSeller: parseFloat(boletoValue),
        buyerFeeToProtocol: buyerFee.amount,
        sellerFeeToProtocol: sellerTransactionFee.finalFee,
        sellerRefund: sellerTransactionFee.refundAmount
      }
    };
  }

  /**
   * 📈 Gera relatório detalhado de uma transação
   * @param {object} transaction - Dados da transação
   * @returns {object} Relatório completo
   */
  generateTransactionReport(transaction) {
    const {
      id,
      boletoValue,
      creationTime,
      status,
      currentTime = new Date()
    } = transaction;

    const feeCalculation = this.calculateAllFees({
      boletoValue,
      creationTime,
      currentTime
    });

    return {
      transactionId: id,
      status: status,
      calculation: feeCalculation,
      recommendations: this.generateRecommendations(feeCalculation),
      createdAt: creationTime,
      calculatedAt: currentTime
    };
  }

  /**
   * 💡 Gera recomendações baseadas no cálculo de taxas
   * @param {object} calculation - Cálculo de taxas
   * @returns {array} Lista de recomendações
   */
  generateRecommendations(calculation) {
    const recommendations = [];

    // Recomendação para upload
    if (!calculation.timerStatus.uploadDeadlinePassed) {
      recommendations.push({
        type: 'WARNING',
        message: `⏰ Restam ${calculation.timerStatus.timeRemaining.untilUploadDeadline.toFixed(1)}h para upload do comprovante`
      });
    } else {
      recommendations.push({
        type: 'ERROR',
        message: '🚨 Prazo para upload do comprovante expirado'
      });
    }

    // Recomendação para vendedor sobre taxa
    if (calculation.sellerTransactionFee.timeCategory === 'FULL_REFUND') {
      recommendations.push({
        type: 'SUCCESS',
        message: '✅ Ainda no período de devolução total da taxa (100%)'
      });
    } else if (calculation.sellerTransactionFee.timeCategory === 'HALF_REFUND') {
      recommendations.push({
        type: 'INFO',
        message: '⚠️  No período de devolução parcial da taxa (50%)'
      });
    } else if (calculation.sellerTransactionFee.timeCategory === 'QUARTER_REFUND') {
      recommendations.push({
        type: 'WARNING',
        message: '⏳ No período de devolução mínima da taxa (25%)'
      });
    } else {
      recommendations.push({
        type: 'ERROR',
        message: '❌ Taxa de transação não será devolvida (0%)'
      });
    }

    // Recomendação para baixa automática
    if (calculation.timerStatus.shouldAutoRelease) {
      recommendations.push({
        type: 'CRITICAL',
        message: '🔄 Transação deve ser liberada automaticamente (72h atingidas)'
      });
    } else {
      const hoursUntilAuto = calculation.timerStatus.timeRemaining.untilAutoRelease;
      recommendations.push({
        type: 'INFO',
        message: `🕒 Baixa automática em ${hoursUntilAuto.toFixed(1)}h`
      });
    }

    return recommendations;
  }

  /**
   * 🔄 Simula diferentes cenários de tempo
   * @param {object} params - Parâmetros da simulação
   * @returns {object} Simulação de cenários
   */
  simulateTimeScenarios(params) {
    const { boletoValue, creationTime } = params;
    const scenarios = [];

    // Simular em diferentes marcos de tempo
    const timePoints = [0.5, 1, 2, 12, 24, 36, 48, 60, 72, 96];

    timePoints.forEach(hours => {
      const simulatedTime = new Date(creationTime.getTime() + (hours * 60 * 60 * 1000));
      const calculation = this.calculateAllFees({
        boletoValue,
        creationTime,
        currentTime: simulatedTime
      });

      scenarios.push({
        hoursElapsed: hours,
        time: simulatedTime,
        calculation: calculation
      });
    });

    return {
      scenarios: scenarios,
      boletoValue: parseFloat(boletoValue),
      creationTime: creationTime
    };
  }
}

// 🏭 Factory para criar instância do serviço
class DynamicFeeServiceFactory {
  static create() {
    return new DynamicFeeService();
  }

  static createWithConfig(config) {
    const service = new DynamicFeeService();
    
    // Permitir override de configurações
    if (config.buyerFeFixed) service.BUYER_FEE_FIXED = config.buyerFeeFixed;
    if (config.buyerFeeThreshold) service.BUYER_FEE_THRESHOLD = config.buyerFeeThreshold;
    if (config.buyerFeePercentage) service.BUYER_FEE_PERCENTAGE = config.buyerFeePercentage;
    if (config.sellerTransactionFee) service.SELLER_TRANSACTION_FEE = config.sellerTransactionFee;
    
    if (config.timeMilestones) {
      Object.assign(service.TIME_MILESTONES, config.timeMilestones);
    }
    
    return service;
  }
}

module.exports = {
  DynamicFeeService,
  DynamicFeeServiceFactory
};

