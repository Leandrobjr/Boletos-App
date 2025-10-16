/**
 * ⏰ SERVIÇO DE TIMEOUT AUTOMÁTICO - BoletoXCrypto Produção
 * 
 * Gerencia timeout automático de boletos no ambiente de produção (Vercel + Neon)
 * - Verifica boletos com status "AGUARDANDO PAGAMENTO" há mais de 60 minutos
 * - Atualiza status para "DISPONIVEL" automaticamente
 * - Integra com smart contract para liberação de fundos
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0 - Produção
 */

const { Pool } = require('pg');
const { ethers } = require('ethers');
const SmartContractService = require('./SmartContractService');

class AutoTimeoutService {
  constructor() {
    // Configuração do banco Neon PostgreSQL
    const resolveDatabaseUrl = () => {
      const envUrl = process.env.DATABASE_URL || '';
      const isLocal = /localhost|127\.0\.0\.1/i.test(envUrl);
      if (envUrl && !isLocal) return envUrl;
      return 'postgresql://neondb_owner:npg_dPQtsIq53OVc@ep-billowing-union-ac0fqn9p-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
    };

    this.pool = new Pool({
      connectionString: resolveDatabaseUrl(),
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Configuração da blockchain
    this.PROVIDER_URL = 'https://rpc-amoy.polygon.technology';
    this.P2P_ESCROW_ADDRESS = '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2';
    
    // Timeout em minutos (60 minutos = 3600000 ms)
    this.TIMEOUT_DURATION = 60 * 60 * 1000;
    
    // Intervalo de verificação (5 minutos)
    this.CHECK_INTERVAL = 5 * 60 * 1000;
    
    this.isRunning = false;
    this.checkTimer = null;
    
    // Serviço de integração com smart contract
    this.smartContractService = new SmartContractService();
  }

  /**
   * 🚀 Inicia o serviço de verificação automática
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ AutoTimeoutService já está rodando');
      return;
    }

    console.log('🚀 Iniciando AutoTimeoutService...');
    console.log(`⏰ Verificação a cada ${this.CHECK_INTERVAL / 1000 / 60} minutos`);
    console.log(`⏳ Timeout de boleto: ${this.TIMEOUT_DURATION / 1000 / 60} minutos`);
    
    this.isRunning = true;
    this.performCheck();
    
    // Configurar verificação periódica
    this.checkTimer = setInterval(() => {
      this.performCheck();
    }, this.CHECK_INTERVAL);

    console.log('✅ AutoTimeoutService iniciado com sucesso');
  }

  /**
   * 🛑 Para o serviço de verificação automática
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ AutoTimeoutService não está rodando');
      return;
    }

    console.log('🛑 Parando AutoTimeoutService...');
    
    this.isRunning = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    console.log('✅ AutoTimeoutService parado');
  }

  /**
   * 🔍 Executa verificação de boletos expirados
   */
  async performCheck() {
    try {
      console.log('🔍 [AUTO_TIMEOUT] Iniciando verificação de boletos expirados...');
      
      const expiredBoletos = await this.findExpiredBoletos();
      
      if (expiredBoletos.length === 0) {
        console.log('✅ [AUTO_TIMEOUT] Nenhum boleto expirado encontrado');
        return;
      }

      console.log(`⚠️ [AUTO_TIMEOUT] Encontrados ${expiredBoletos.length} boletos expirados`);
      
      for (const boleto of expiredBoletos) {
        await this.processExpiredBoleto(boleto);
      }

      console.log('✅ [AUTO_TIMEOUT] Verificação concluída');

    } catch (error) {
      console.error('❌ [AUTO_TIMEOUT] Erro na verificação:', error);
    }
  }

  /**
   * 🔍 Busca boletos que excederam o tempo limite
   */
  async findExpiredBoletos() {
    const query = `
      SELECT 
        id, numero_controle, user_id, valor_brl, valor_usdt, 
        status, criado_em, data_travamento, escrow_id, tx_hash
      FROM boletos 
      WHERE 
        status IN ('AGUARDANDO_PAGAMENTO','AGUARDANDO PAGAMENTO') 
        AND data_travamento IS NOT NULL
        AND NOW() - data_travamento > INTERVAL '60 minutes'
      ORDER BY data_travamento ASC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * ⚡ Processa um boleto expirado
   */
  async processExpiredBoleto(boleto) {
    try {
      console.log(`🔄 [AUTO_TIMEOUT] Processando boleto expirado: ${boleto.numero_controle}`);
      
      // 1. Atualizar status no banco para DISPONIVEL
      await this.updateBoletoStatus(boleto.id, 'DISPONIVEL');
      
      // 2. Limpar dados de comprador
      await this.clearBuyerData(boleto.id);
      
      // 3. Se tiver escrow_id válido, tentar liberar fundos no smart contract
      if (boleto.escrow_id && boleto.escrow_id !== '0x123' && boleto.escrow_id.length > 10) {
        await this.releaseFundsFromContract(boleto);
      }

      console.log(`✅ [AUTO_TIMEOUT] Boleto ${boleto.numero_controle} processado com sucesso`);

    } catch (error) {
      console.error(`❌ [AUTO_TIMEOUT] Erro ao processar boleto ${boleto.numero_controle}:`, error);
    }
  }

  /**
   * 📝 Atualiza status do boleto no banco
   */
  async updateBoletoStatus(boletoId, newStatus) {
    const query = `
      UPDATE boletos 
      SET 
        status = $1,
        data_destravamento = NOW(),
        motivo_destravamento = 'TIMEOUT_AUTOMATICO_60_MINUTOS'
      WHERE id = $2
      RETURNING *
    `;

    let result;
    try {
      result = await this.pool.query(query, [newStatus, boletoId]);
    } catch (error) {
      // Fallback quando coluna motivo_destravamento OU data_destravamento não existe
      if (String(error.code) === '42703') {
        const minimalQuery = `
          UPDATE boletos 
          SET status = $1
          WHERE id = $2
          RETURNING *
        `;
        result = await this.pool.query(minimalQuery, [newStatus, boletoId]);
      } else {
        throw error;
      }
    }
    
    if (result.rowCount === 0) {
      throw new Error(`Boleto ${boletoId} não encontrado para atualização`);
    }

    console.log(`📝 [AUTO_TIMEOUT] Status atualizado para ${newStatus}: boleto ${boletoId}`);
    return result.rows[0];
  }

  /**
   * 🧹 Limpa dados do comprador
   */
  async clearBuyerData(boletoId) {
    const query = `
      UPDATE boletos 
      SET 
        comprador_id = NULL,
        wallet_address = NULL,
        data_compra = NULL,
        tempo_limite = NULL
      WHERE id = $1
    `;

    try {
      await this.pool.query(query, [boletoId]);
    } catch (error) {
      if (String(error.code) === '42703') {
        const minimalQuery = `
          UPDATE boletos 
          SET 
            comprador_id = NULL,
            wallet_address = NULL
          WHERE id = $1
        `;
        await this.pool.query(minimalQuery, [boletoId]);
      } else {
        throw error;
      }
    }
    console.log(`🧹 [AUTO_TIMEOUT] Dados do comprador limpos: boleto ${boletoId}`);
  }

  /**
   * 🔗 Libera fundos do smart contract
   */
  async releaseFundsFromContract(boleto) {
    try {
      console.log(`🔗 [AUTO_TIMEOUT] Tentando liberar fundos do contrato para boleto ${boleto.numero_controle}`);
      
      // Verificar se a transação está realmente expirada no smart contract
      const expirationCheck = await this.smartContractService.isTransactionExpired(boleto.numero_controle);
      
      if (!expirationCheck.expired) {
        console.log(`⚠️ [AUTO_TIMEOUT] Boleto ${boleto.numero_controle} não está expirado no contrato: ${expirationCheck.reason}`);
        return;
      }
      
      console.log(`✅ [AUTO_TIMEOUT] Boleto ${boleto.numero_controle} confirmado como expirado no contrato (${expirationCheck.timeSinceSelectionMinutes} minutos)`);
      
      // Buscar transaction ID no contrato
      const transaction = await this.smartContractService.getTransactionByBoletoId(boleto.numero_controle);
      
      if (!transaction) {
        console.log(`⚠️ [AUTO_TIMEOUT] Transação não encontrada no contrato para boleto ${boleto.numero_controle}`);
        return;
      }
      
      // Tentar expirar a transação no contrato
      const expireResult = await this.smartContractService.expireTransactions([transaction.transactionId]);
      
      if (expireResult.success) {
        console.log(`✅ [AUTO_TIMEOUT] Fundos liberados no contrato para boleto ${boleto.numero_controle}: ${expireResult.transactionHash}`);
      } else {
        console.log(`⚠️ [AUTO_TIMEOUT] Não foi possível liberar fundos automaticamente: ${expireResult.reason}`);
        console.log(`📋 [AUTO_TIMEOUT] Transaction ID para liberação manual: ${transaction.transactionId}`);
      }
      
    } catch (error) {
      console.error(`❌ [AUTO_TIMEOUT] Erro ao liberar fundos do contrato:`, error);
    }
  }

  /**
   * 📊 Obtém estatísticas do serviço
   */
  async getStats() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_boletos,
          COUNT(CASE WHEN status = 'DISPONIVEL' THEN 1 END) as disponiveis,
          COUNT(CASE WHEN status IN ('AGUARDANDO_PAGAMENTO','AGUARDANDO PAGAMENTO') THEN 1 END) as aguardando_pagamento,
          COUNT(CASE WHEN status = 'BAIXADO' THEN 1 END) as baixados,
          COUNT(CASE WHEN motivo_destravamento = 'TIMEOUT_AUTOMATICO_60_MINUTOS' THEN 1 END) as timeout_automaticos
        FROM boletos
      `;

      const result = await this.pool.query(statsQuery);
      
      return {
        ...result.rows[0],
        serviceRunning: this.isRunning,
        lastCheck: new Date().toISOString(),
        timeoutDuration: this.TIMEOUT_DURATION / 1000 / 60,
        checkInterval: this.CHECK_INTERVAL / 1000 / 60
      };

    } catch (error) {
      console.error('❌ [AUTO_TIMEOUT] Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

module.exports = AutoTimeoutService;
