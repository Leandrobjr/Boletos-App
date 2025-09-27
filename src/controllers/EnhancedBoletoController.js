/**
 * 🎮 CONTROLADOR APRIMORADO DE BOLETOS - BoletoXCrypto
 * 
 * Integra o sistema de taxas dinâmicas e temporizadores
 * com as operações de boletos existentes.
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

const { DynamicFeeServiceFactory } = require('../services/DynamicFeeService');
const { TimerServiceFactory } = require('../services/TimerService');

class EnhancedBoletoController {
  constructor() {
    this.feeService = DynamicFeeServiceFactory.create();
    this.timerService = TimerServiceFactory.create();
    
    // Configurar listeners de eventos
    this.setupEventListeners();
  }

  /**
   * 👂 Configura listeners para eventos de timer
   */
  setupEventListeners() {
    // Listener: Deadline de upload
    this.timerService.on('upload_deadline_reached', async (event) => {
      await this.handleUploadDeadlineReached(event);
    });

    // Listener: Mudança de taxa
    this.timerService.on('transaction_fee_changed', async (event) => {
      await this.handleTransactionFeeChanged(event);
    });

    // Listener: Baixa automática
    this.timerService.on('auto_release_due', async (event) => {
      await this.handleAutoReleaseDue(event);
    });
  }

  /**
   * 📝 Cria boleto com taxas dinâmicas e temporizadores
   * @param {object} boletoData - Dados do boleto
   * @returns {object} Boleto criado com informações de taxa
   */
  async createBoletoWithDynamicFees(boletoData) {
    try {
      console.log('💰 Criando boleto com taxas dinâmicas...');
      
      // 1. Calcular todas as taxas
      const feeCalculation = this.feeService.calculateAllFees({
        boletoValue: boletoData.valor,
        creationTime: new Date()
      });

      // 2. Criar estrutura de dados aprimorada
      const enhancedBoletoData = {
        ...boletoData,
        // Informações de taxa
        buyer_fee: feeCalculation.buyerFee.amount,
        buyer_fee_type: feeCalculation.buyerFee.type,
        seller_transaction_fee: feeCalculation.sellerTransactionFee.baseFee,
        current_seller_fee: feeCalculation.sellerTransactionFee.finalFee,
        seller_refund_amount: feeCalculation.sellerTransactionFee.refundAmount,
        
        // Valores totais
        buyer_total_cost: feeCalculation.totals.buyerPays,
        seller_receives: feeCalculation.totals.sellerReceives,
        protocol_earnings: feeCalculation.totals.protocolEarns,
        
        // Informações de tempo
        creation_time: new Date(),
        fee_calculation: JSON.stringify(feeCalculation),
        
        // Status inicial
        status: 'DISPONIVEL',
        timer_status: 'ACTIVE'
      };

      // 3. Criar timers automáticos
      const timers = this.timerService.createTransactionTimers({
        id: boletoData.numeroControle,
        numeroControle: boletoData.numeroControle,
        creationTime: enhancedBoletoData.creation_time
      });

      // 4. Retornar resultado completo
      return {
        success: true,
        boleto: enhancedBoletoData,
        feeCalculation: feeCalculation,
        timers: timers.map(t => ({
          type: t.type,
          triggersAt: t.triggersAt
        })),
        message: 'Boleto criado com sucesso com taxas dinâmicas'
      };

    } catch (error) {
      console.error('❌ Erro ao criar boleto com taxas dinâmicas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 💳 Processa seleção de boleto pelo comprador
   * @param {string} numeroControle - Número de controle do boleto
   * @param {string} compradorId - ID do comprador
   * @returns {object} Resultado da operação
   */
  async processarSelecaoBoleto(numeroControle, compradorId) {
    try {
      console.log(`💳 Processando seleção de boleto ${numeroControle} pelo comprador ${compradorId}`);

      // 1. Buscar boleto (implementar busca no banco)
      const boleto = await this.buscarBoleto(numeroControle);
      
      if (!boleto) {
        return { success: false, error: 'Boleto não encontrado' };
      }

      if (boleto.status !== 'DISPONIVEL') {
        return { success: false, error: 'Boleto não está disponível' };
      }

      // 2. Calcular taxas atuais
      const feeCalculation = this.feeService.calculateAllFees({
        boletoValue: boleto.valor,
        creationTime: new Date(boleto.creation_time)
      });

      // 3. Atualizar status
      const updatedBoleto = {
        ...boleto,
        status: 'AGUARDANDO_PAGAMENTO',
        comprador_id: compradorId,
        selection_time: new Date(),
        current_fee_calculation: JSON.stringify(feeCalculation)
      };

      // 4. Retornar informações para o comprador
      return {
        success: true,
        boleto: updatedBoleto,
        paymentInfo: {
          boletoValue: parseFloat(boleto.valor),
          buyerFee: feeCalculation.buyerFee.amount,
          totalToPay: feeCalculation.totals.buyerPays,
          feeDescription: feeCalculation.buyerFee.description
        },
        deadlines: {
          uploadDeadline: new Date(Date.now() + (1 * 60 * 60 * 1000)), // 1h
          autoRelease: new Date(Date.now() + (72 * 60 * 60 * 1000)) // 72h
        }
      };

    } catch (error) {
      console.error('❌ Erro ao processar seleção de boleto:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📤 Processa upload de comprovante
   * @param {string} numeroControle - Número de controle
   * @param {object} comprovanteData - Dados do comprovante
   * @returns {object} Resultado da operação
   */
  async processarUploadComprovante(numeroControle, comprovanteData) {
    try {
      console.log(`📤 Processando upload de comprovante para ${numeroControle}`);

      // 1. Verificar se ainda está no prazo
      const boleto = await this.buscarBoleto(numeroControle);
      
      if (!boleto) {
        return { success: false, error: 'Boleto não encontrado' };
      }

      const timerStatus = this.feeService.checkTimerStatus(
        new Date(boleto.creation_time),
        new Date()
      );

      if (timerStatus.uploadDeadlinePassed) {
        return { 
          success: false, 
          error: 'Prazo para upload expirado (1 hora)',
          deadlinePassed: true
        };
      }

      // 2. Atualizar status
      const updatedBoleto = {
        ...boleto,
        status: 'AGUARDANDO_BAIXA',
        comprovante_url: comprovanteData.url,
        upload_time: new Date()
      };

      // 3. Recalcular taxas no momento do upload
      const currentFeeCalculation = this.feeService.calculateAllFees({
        boletoValue: boleto.valor,
        creationTime: new Date(boleto.creation_time),
        currentTime: new Date()
      });

      return {
        success: true,
        boleto: updatedBoleto,
        message: 'Comprovante enviado com sucesso',
        feeInfo: {
          sellerCurrentRefund: currentFeeCalculation.sellerTransactionFee.refundAmount,
          refundPercentage: currentFeeCalculation.sellerTransactionFee.refundPercentage,
          timeCategory: currentFeeCalculation.sellerTransactionFee.timeCategory
        },
        timeRemaining: timerStatus.timeRemaining
      };

    } catch (error) {
      console.error('❌ Erro ao processar upload de comprovante:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ Processa baixa do boleto pelo vendedor
   * @param {string} numeroControle - Número de controle
   * @param {string} vendedorId - ID do vendedor
   * @returns {object} Resultado da operação
   */
  async processarBaixaBoleto(numeroControle, vendedorId) {
    try {
      console.log(`✅ Processando baixa de boleto ${numeroControle} pelo vendedor ${vendedorId}`);

      // 1. Buscar boleto
      const boleto = await this.buscarBoleto(numeroControle);
      
      if (!boleto) {
        return { success: false, error: 'Boleto não encontrado' };
      }

      if (boleto.user_id !== vendedorId) {
        return { success: false, error: 'Vendedor não autorizado' };
      }

      if (boleto.status !== 'AGUARDANDO_BAIXA') {
        return { success: false, error: 'Boleto não pode ser baixado neste status' };
      }

      // 2. Calcular taxas finais
      const finalFeeCalculation = this.feeService.calculateAllFees({
        boletoValue: boleto.valor,
        creationTime: new Date(boleto.creation_time),
        currentTime: new Date()
      });

      // 3. Cancelar timers restantes
      this.timerService.cancelTransactionTimers(numeroControle);

      // 4. Preparar dados para blockchain
      const blockchainData = {
        escrowId: boleto.escrow_id,
        sellerReceives: finalFeeCalculation.totals.sellerReceives,
        buyerRefund: 0, // Comprador não recebe devolução
        protocolFees: finalFeeCalculation.totals.protocolEarns,
        sellerRefund: finalFeeCalculation.sellerTransactionFee.refundAmount
      };

      // 5. Atualizar status
      const updatedBoleto = {
        ...boleto,
        status: 'BAIXADO',
        baixa_time: new Date(),
        final_fee_calculation: JSON.stringify(finalFeeCalculation),
        timer_status: 'CANCELLED'
      };

      return {
        success: true,
        boleto: updatedBoleto,
        blockchainData: blockchainData,
        feeBreakdown: finalFeeCalculation.breakdown,
        message: 'Boleto baixado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao processar baixa de boleto:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 Gera relatório detalhado de uma transação
   * @param {string} numeroControle - Número de controle
   * @returns {object} Relatório completo
   */
  async gerarRelatorioTransacao(numeroControle) {
    try {
      const boleto = await this.buscarBoleto(numeroControle);
      
      if (!boleto) {
        return { success: false, error: 'Boleto não encontrado' };
      }

      // Gerar relatório usando o serviço de taxas
      const report = this.feeService.generateTransactionReport({
        id: numeroControle,
        boletoValue: boleto.valor,
        creationTime: new Date(boleto.creation_time),
        status: boleto.status
      });

      // Adicionar informações de timer
      const timerStatus = this.timerService.getTransactionTimerStatus(numeroControle);

      return {
        success: true,
        report: {
          ...report,
          timerStatus: timerStatus,
          currentStatus: boleto.status
        }
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔍 Busca boleto no banco de dados (mock)
   * @param {string} numeroControle - Número de controle
   * @returns {object|null} Dados do boleto
   */
  async buscarBoleto(numeroControle) {
    // TODO: Implementar busca real no banco de dados
    // Este é um mock para demonstração
    console.log(`🔍 Buscando boleto ${numeroControle}...`);
    return null;
  }

  // ========================================
  // 🎯 EVENT HANDLERS
  // ========================================

  /**
   * ⏰ Handler: Deadline de upload atingido
   * @param {object} event - Evento de deadline
   */
  async handleUploadDeadlineReached(event) {
    const { transaction } = event;
    console.log(`⏰ Processando deadline de upload para ${transaction.numeroControle}`);

    try {
      // 1. Atualizar status para expirado
      const updatedBoleto = {
        status: 'VENCIDO',
        expiration_reason: 'UPLOAD_DEADLINE_EXCEEDED',
        expired_at: new Date()
      };

      // 2. Cancelar timers restantes
      this.timerService.cancelTransactionTimers(transaction.numeroControle);

      // 3. Liberar USDT para o vendedor (se aplicável)
      // TODO: Implementar liberação blockchain

      console.log(`✅ Boleto ${transaction.numeroControle} marcado como vencido`);

    } catch (error) {
      console.error(`❌ Erro ao processar deadline de upload:`, error);
    }
  }

  /**
   * 💰 Handler: Mudança de taxa de transação
   * @param {object} event - Evento de mudança de taxa
   */
  async handleTransactionFeeChanged(event) {
    const { transaction, milestone, feeInfo } = event;
    console.log(`💰 Processando mudança de taxa (${milestone}) para ${transaction.numeroControle}`);

    try {
      // Recalcular taxas com novo marco de tempo
      const newFeeCalculation = this.feeService.calculateAllFees({
        boletoValue: transaction.valor || 100, // valor padrão se não informado
        creationTime: new Date(transaction.creationTime),
        currentTime: new Date()
      });

      // Atualizar informações no banco (se necessário)
      console.log(`📊 Nova taxa de devolução: ${newFeeCalculation.sellerTransactionFee.refundPercentage}%`);

    } catch (error) {
      console.error(`❌ Erro ao processar mudança de taxa:`, error);
    }
  }

  /**
   * 🔄 Handler: Baixa automática necessária
   * @param {object} event - Evento de baixa automática
   */
  async handleAutoReleaseDue(event) {
    const { transaction } = event;
    console.log(`🔄 Processando baixa automática para ${transaction.numeroControle}`);

    try {
      // 1. Buscar dados atuais do boleto
      const boleto = await this.buscarBoleto(transaction.numeroControle);
      
      if (!boleto) {
        console.error(`❌ Boleto ${transaction.numeroControle} não encontrado para baixa automática`);
        return;
      }

      // 2. Calcular taxas finais (sem devolução após 72h)
      const finalFeeCalculation = this.feeService.calculateAllFees({
        boletoValue: boleto.valor,
        creationTime: new Date(boleto.creation_time),
        currentTime: new Date()
      });

      // 3. Executar baixa automática
      // TODO: Implementar chamada automática para approvePayment() no blockchain

      // 4. Atualizar status
      const updatedBoleto = {
        status: 'BAIXADO',
        baixa_type: 'AUTOMATIC',
        baixa_time: new Date(),
        final_fee_calculation: JSON.stringify(finalFeeCalculation)
      };

      console.log(`✅ Baixa automática executada para ${transaction.numeroControle}`);

    } catch (error) {
      console.error(`❌ Erro ao processar baixa automática:`, error);
    }
  }

  /**
   * 📊 Obtém estatísticas do sistema
   * @returns {object} Estatísticas detalhadas
   */
  getSystemStats() {
    return {
      timers: this.timerService.getStats(),
      activeTransactions: this.timerService.getActiveTimers(),
      timestamp: new Date()
    };
  }

  /**
   * 🧹 Limpeza geral do sistema
   * @returns {object} Resultado da limpeza
   */
  cleanup() {
    const cleanedTimers = this.timerService.cleanup();
    
    return {
      success: true,
      cleanedTimers: cleanedTimers,
      timestamp: new Date()
    };
  }
}

module.exports = {
  EnhancedBoletoController
};

