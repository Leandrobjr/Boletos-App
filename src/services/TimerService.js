/**
 * ⏰ SERVIÇO DE TEMPORIZADORES - BoletoXCrypto
 * 
 * Gerencia todos os temporizadores automáticos do sistema:
 * - Upload de comprovante (1h)
 * - Marcos de taxa de transação (2h, 24h, 48h)
 * - Baixa automática (72h)
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

const EventEmitter = require('events');

class TimerService extends EventEmitter {
  constructor() {
    super();
    this.activeTimers = new Map();
    this.timerCallbacks = new Map();
    
    // Configurações de tempo (em milissegundos)
    this.TIMEOUTS = {
      UPLOAD_DEADLINE: 1 * 60 * 60 * 1000, // 1 hora
      TRANSACTION_FEE_2H: 2 * 60 * 60 * 1000, // 2 horas
      TRANSACTION_FEE_24H: 24 * 60 * 60 * 1000, // 24 horas
      TRANSACTION_FEE_48H: 48 * 60 * 60 * 1000, // 48 horas
      AUTO_RELEASE: 72 * 60 * 60 * 1000 // 72 horas
    };

    // Eventos disponíveis
    this.EVENTS = {
      UPLOAD_DEADLINE_REACHED: 'upload_deadline_reached',
      TRANSACTION_FEE_CHANGED: 'transaction_fee_changed',
      AUTO_RELEASE_DUE: 'auto_release_due',
      TIMER_CREATED: 'timer_created',
      TIMER_CANCELLED: 'timer_cancelled'
    };
  }

  /**
   * ⚡ Cria todos os temporizadores para uma transação
   * @param {object} transaction - Dados da transação
   */
  createTransactionTimers(transaction) {
    const { id, numeroControle, creationTime } = transaction;
    const timerId = numeroControle || id;
    
    console.log(`⏰ Criando temporizadores para transação ${timerId}`);
    
    const timers = [];
    const now = Date.now();
    const startTime = new Date(creationTime).getTime();

    // Timer 1: Deadline de upload (1h)
    const uploadTimer = this.createTimer({
      id: `${timerId}_upload`,
      delay: Math.max(0, startTime + this.TIMEOUTS.UPLOAD_DEADLINE - now),
      callback: () => this.handleUploadDeadline(transaction),
      type: 'UPLOAD_DEADLINE'
    });
    timers.push(uploadTimer);

    // Timer 2: Marco de taxa 2h
    const fee2hTimer = this.createTimer({
      id: `${timerId}_fee_2h`,
      delay: Math.max(0, startTime + this.TIMEOUTS.TRANSACTION_FEE_2H - now),
      callback: () => this.handleTransactionFeeChange(transaction, '2H'),
      type: 'TRANSACTION_FEE_2H'
    });
    timers.push(fee2hTimer);

    // Timer 3: Marco de taxa 24h
    const fee24hTimer = this.createTimer({
      id: `${timerId}_fee_24h`,
      delay: Math.max(0, startTime + this.TIMEOUTS.TRANSACTION_FEE_24H - now),
      callback: () => this.handleTransactionFeeChange(transaction, '24H'),
      type: 'TRANSACTION_FEE_24H'
    });
    timers.push(fee24hTimer);

    // Timer 4: Marco de taxa 48h
    const fee48hTimer = this.createTimer({
      id: `${timerId}_fee_48h`,
      delay: Math.max(0, startTime + this.TIMEOUTS.TRANSACTION_FEE_48H - now),
      callback: () => this.handleTransactionFeeChange(transaction, '48H'),
      type: 'TRANSACTION_FEE_48H'
    });
    timers.push(fee48hTimer);

    // Timer 5: Baixa automática (72h)
    const autoReleaseTimer = this.createTimer({
      id: `${timerId}_auto_release`,
      delay: Math.max(0, startTime + this.TIMEOUTS.AUTO_RELEASE - now),
      callback: () => this.handleAutoRelease(transaction),
      type: 'AUTO_RELEASE'
    });
    timers.push(autoReleaseTimer);

    // Armazenar referência dos timers
    this.activeTimers.set(timerId, timers);

    this.emit(this.EVENTS.TIMER_CREATED, {
      transactionId: timerId,
      timersCount: timers.length,
      createdAt: new Date()
    });

    return timers;
  }

  /**
   * ⏲️ Cria um timer individual
   * @param {object} params - Parâmetros do timer
   * @returns {object} Referência do timer
   */
  createTimer({ id, delay, callback, type }) {
    const timeoutId = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error(`❌ Erro no timer ${id}:`, error);
      } finally {
        // Limpar referência do timer
        this.timerCallbacks.delete(id);
      }
    }, delay);

    const timer = {
      id,
      type,
      timeoutId,
      createdAt: new Date(),
      triggersAt: new Date(Date.now() + delay),
      delay
    };

    this.timerCallbacks.set(id, timer);
    
    console.log(`⏰ Timer ${id} (${type}) criado - dispara em ${(delay / 1000 / 60).toFixed(1)} minutos`);
    
    return timer;
  }

  /**
   * 📤 Handler: Deadline de upload atingido
   * @param {object} transaction - Dados da transação
   */
  handleUploadDeadline(transaction) {
    console.log(`⏰ DEADLINE: Upload de comprovante expirado para ${transaction.numeroControle}`);
    
    this.emit(this.EVENTS.UPLOAD_DEADLINE_REACHED, {
      transaction,
      timestamp: new Date(),
      action: 'MARK_AS_EXPIRED'
    });

    // Aqui você pode implementar ações automáticas:
    // - Marcar transação como expirada
    // - Notificar usuários
    // - Liberar USDT para o vendedor
  }

  /**
   * 💰 Handler: Marco de taxa de transação atingido
   * @param {object} transaction - Dados da transação
   * @param {string} milestone - Marco atingido (2H, 24H, 48H)
   */
  handleTransactionFeeChange(transaction, milestone) {
    console.log(`💰 TAXA: Marco ${milestone} atingido para ${transaction.numeroControle}`);
    
    const feeInfo = this.getFeeInfoForMilestone(milestone);
    
    this.emit(this.EVENTS.TRANSACTION_FEE_CHANGED, {
      transaction,
      milestone,
      feeInfo,
      timestamp: new Date()
    });

    // Aqui você pode implementar:
    // - Atualizar cálculo de taxa no banco
    // - Notificar vendedor sobre mudança
    // - Recalcular valores de devolução
  }

  /**
   * 🔄 Handler: Baixa automática
   * @param {object} transaction - Dados da transação
   */
  handleAutoRelease(transaction) {
    console.log(`🔄 AUTO RELEASE: Liberação automática para ${transaction.numeroControle}`);
    
    this.emit(this.EVENTS.AUTO_RELEASE_DUE, {
      transaction,
      timestamp: new Date(),
      action: 'AUTO_APPROVE_PAYMENT'
    });

    // Aqui você pode implementar:
    // - Chamar approvePayment() automaticamente
    // - Transferir USDT para comprador
    // - Marcar transação como finalizada
    // - Notificar todas as partes
  }

  /**
   * 📊 Obtém informações de taxa para um marco
   * @param {string} milestone - Marco de tempo
   * @returns {object} Informações da taxa
   */
  getFeeInfoForMilestone(milestone) {
    const feeMap = {
      '2H': { refundPercentage: 100, description: 'Período de devolução total encerrado' },
      '24H': { refundPercentage: 50, description: 'Período de devolução parcial encerrado' },
      '48H': { refundPercentage: 25, description: 'Período de devolução mínima encerrado' }
    };

    return feeMap[milestone] || { refundPercentage: 0, description: 'Marco desconhecido' };
  }

  /**
   * ❌ Cancela todos os timers de uma transação
   * @param {string} transactionId - ID da transação
   */
  cancelTransactionTimers(transactionId) {
    const timers = this.activeTimers.get(transactionId);
    
    if (!timers) {
      console.log(`⚠️  Nenhum timer encontrado para transação ${transactionId}`);
      return false;
    }

    let cancelledCount = 0;
    timers.forEach(timer => {
      if (this.cancelTimer(timer.id)) {
        cancelledCount++;
      }
    });

    this.activeTimers.delete(transactionId);
    
    console.log(`❌ ${cancelledCount} timers cancelados para transação ${transactionId}`);
    
    this.emit(this.EVENTS.TIMER_CANCELLED, {
      transactionId,
      cancelledCount,
      timestamp: new Date()
    });

    return true;
  }

  /**
   * ❌ Cancela um timer específico
   * @param {string} timerId - ID do timer
   * @returns {boolean} Sucesso na operação
   */
  cancelTimer(timerId) {
    const timer = this.timerCallbacks.get(timerId);
    
    if (!timer) {
      return false;
    }

    clearTimeout(timer.timeoutId);
    this.timerCallbacks.delete(timerId);
    
    console.log(`❌ Timer ${timerId} cancelado`);
    return true;
  }

  /**
   * 📋 Lista todos os timers ativos
   * @returns {object} Lista de timers ativos
   */
  getActiveTimers() {
    const activeTimers = {};
    
    this.activeTimers.forEach((timers, transactionId) => {
      activeTimers[transactionId] = timers.map(timer => ({
        id: timer.id,
        type: timer.type,
        createdAt: timer.createdAt,
        triggersAt: timer.triggersAt,
        remainingMs: timer.triggersAt.getTime() - Date.now()
      }));
    });

    return {
      count: this.timerCallbacks.size,
      transactions: Object.keys(activeTimers).length,
      timers: activeTimers
    };
  }

  /**
   * 🕐 Verifica status de timers para uma transação
   * @param {string} transactionId - ID da transação
   * @returns {object} Status dos timers
   */
  getTransactionTimerStatus(transactionId) {
    const timers = this.activeTimers.get(transactionId);
    
    if (!timers) {
      return { exists: false, message: 'Nenhum timer encontrado' };
    }

    const now = Date.now();
    const status = timers.map(timer => ({
      id: timer.id,
      type: timer.type,
      triggersAt: timer.triggersAt,
      remainingMs: Math.max(0, timer.triggersAt.getTime() - now),
      remainingMinutes: Math.max(0, (timer.triggersAt.getTime() - now) / (1000 * 60)),
      hasTriggered: timer.triggersAt.getTime() <= now
    }));

    return {
      exists: true,
      transactionId,
      timers: status,
      activeCount: status.filter(t => !t.hasTriggered).length,
      triggeredCount: status.filter(t => t.hasTriggered).length
    };
  }

  /**
   * 🧹 Limpeza geral de timers expirados
   */
  cleanup() {
    let cleanedCount = 0;
    
    this.timerCallbacks.forEach((timer, timerId) => {
      if (timer.triggersAt.getTime() <= Date.now()) {
        this.cancelTimer(timerId);
        cleanedCount++;
      }
    });

    console.log(`🧹 Limpeza concluída: ${cleanedCount} timers expirados removidos`);
    return cleanedCount;
  }

  /**
   * 📊 Estatísticas do serviço
   * @returns {object} Estatísticas detalhadas
   */
  getStats() {
    const now = Date.now();
    let upcomingCount = 0;
    let expiredCount = 0;

    this.timerCallbacks.forEach(timer => {
      if (timer.triggersAt.getTime() > now) {
        upcomingCount++;
      } else {
        expiredCount++;
      }
    });

    return {
      total: this.timerCallbacks.size,
      upcoming: upcomingCount,
      expired: expiredCount,
      transactions: this.activeTimers.size,
      timestamp: new Date()
    };
  }
}

// 🏭 Factory para criar instância do serviço
class TimerServiceFactory {
  static create() {
    return new TimerService();
  }

  static createWithConfig(config) {
    const service = new TimerService();
    
    // Permitir override de timeouts
    if (config.timeouts) {
      Object.assign(service.TIMEOUTS, config.timeouts);
    }
    
    return service;
  }
}

module.exports = {
  TimerService,
  TimerServiceFactory
};

