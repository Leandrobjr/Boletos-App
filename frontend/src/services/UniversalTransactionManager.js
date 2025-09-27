/**
 * UNIVERSAL TRANSACTION MANAGER - ARQUITETURA CORPORATIVA
 * Gerenciador central que coordena todas as transações blockchain
 */

import { ethers } from 'ethers';
import { WalletRouter } from './WalletRouter';
import { WalletAdapterFactory } from './WalletAdapters';

export class UniversalTransactionManager {
  constructor() {
    this.currentAdapter = null;
    this.currentWallet = null;
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1s
      maxDelay: 5000   // 5s
    };
    console.log('🎯 [UTM] Universal Transaction Manager inicializado');
  }

  /**
   * Inicialização inteligente do sistema
   */
  async initialize() {
    try {
      console.log('🎯 [UTM] Inicializando sistema...');
      
      // 1. Detectar melhor wallet
      this.currentWallet = WalletRouter.detectOptimalWallet();
      console.log(`🎯 [UTM] Wallet detectado: ${this.currentWallet.name} (Prioridade: ${this.currentWallet.priority})`);
      
      // 2. Validar wallet
      const isValid = await WalletRouter.validateWallet(this.currentWallet);
      if (!isValid) {
        console.log(`⚠️ [UTM] ${this.currentWallet.name} inválido, tentando alternativa...`);
        
        // Tentar wallet alternativo
        try {
          this.currentWallet = await WalletRouter.switchToAlternativeWallet(this.currentWallet);
          console.log(`🔄 [UTM] Mudou para ${this.currentWallet.name}`);
          
          // Validar o novo wallet
          const newIsValid = await WalletRouter.validateWallet(this.currentWallet);
          if (!newIsValid) {
            throw new Error(`Nenhum wallet funcional encontrado`);
          }
        } catch (switchError) {
          throw new Error(`Wallet ${this.currentWallet.name} inválido e nenhuma alternativa disponível: ${switchError.message}`);
        }
      }
      
      // 3. Criar adapter
      this.currentAdapter = WalletAdapterFactory.create(this.currentWallet);
      console.log(`✅ [UTM] Adapter criado para ${this.currentWallet.name}`);
      
      // 4. Conectar
      const connectionResult = await this.currentAdapter.connect();
      console.log(`✅ [UTM] Sistema inicializado com ${this.currentWallet.name}`);
      
      return {
        wallet: this.currentWallet,
        adapter: this.currentAdapter,
        connection: connectionResult
      };
    } catch (error) {
      console.error('❌ [UTM] Erro na inicialização:', error.message);
      throw error;
    }
  }

  /**
   * Executar transação com fallbacks automáticos
   */
  async executeTransaction(params) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🎯 [UTM] Tentativa ${attempt}/${this.retryConfig.maxRetries}`);
        
        if (!this.currentAdapter) {
          console.log('🎯 [UTM] Adapter não inicializado, inicializando...');
          await this.initialize();
        }
        
        const result = await this.currentAdapter.executeTransaction(params);
        console.log(`✅ [UTM] Transação executada com sucesso: ${result.hash}`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [UTM] Tentativa ${attempt} falhou: ${error.message}`);
        
        // Verificar se deve tentar wallet alternativo
        if (this.shouldSwitchWallet(error)) {
          try {
            console.log('🔄 [UTM] Tentando wallet alternativo...');
            await this.switchToAlternativeWallet();
            continue; // Tentar novamente com novo wallet
          } catch (switchError) {
            console.warn('⚠️ [UTM] Falha ao mudar wallet:', switchError.message);
          }
        }
        
        // Delay antes da próxima tentativa
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          console.log(`⏱️ [UTM] Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`UTM: Todas as tentativas falharam. Último erro: ${lastError?.message || 'Desconhecido'}`);
  }

  /**
   * Executar método de contrato inteligente
   */
  async executeContractMethod(contract, methodName, args, options = {}) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🎯 [UTM] ${methodName} - Tentativa ${attempt}/${this.retryConfig.maxRetries}`);
        
        if (!this.currentAdapter) {
          await this.initialize();
        }
        
        const result = await this.currentAdapter.executeContractMethod(
          contract, 
          methodName, 
          args, 
          options
        );
        
        console.log(`✅ [UTM] ${methodName} executado com sucesso: ${result.hash}`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [UTM] ${methodName} tentativa ${attempt} falhou: ${error.message}`);
        
        if (this.shouldSwitchWallet(error)) {
          try {
            await this.switchToAlternativeWallet();
            continue;
          } catch (switchError) {
            console.warn('⚠️ [UTM] Falha ao mudar wallet:', switchError.message);
          }
        }
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`UTM ${methodName}: Todas as tentativas falharam. Último erro: ${lastError?.message || 'Desconhecido'}`);
  }

  /**
   * Verificar se deve mudar de wallet baseado no erro
   */
  shouldSwitchWallet(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;
    
    // Erros que indicam problema específico do MetaMask
    const metaMaskErrors = [
      'internal json-rpc error',
      '-32603',
      'missing trie node',
      'execution reverted'
    ];
    
    const shouldSwitch = metaMaskErrors.some(errorType => 
      errorMessage.includes(errorType) || String(errorCode).includes(errorType)
    );
    
    if (shouldSwitch && this.currentWallet?.type === 'METAMASK') {
      console.log('🔄 [UTM] Erro específico do MetaMask detectado, tentando alternativa');
      return true;
    }
    
    return false;
  }

  /**
   * Mudar para wallet alternativo
   */
  async switchToAlternativeWallet() {
    try {
      const alternativeWallet = await WalletRouter.switchToAlternativeWallet(this.currentWallet);
      console.log(`🔄 [UTM] Mudando de ${this.currentWallet.name} para ${alternativeWallet.name}`);
      
      this.currentWallet = alternativeWallet;
      this.currentAdapter = WalletAdapterFactory.create(alternativeWallet);
      
      await this.currentAdapter.connect();
      console.log(`✅ [UTM] Mudança para ${alternativeWallet.name} concluída`);
      
    } catch (error) {
      console.error('❌ [UTM] Erro ao mudar wallet:', error.message);
      throw error;
    }
  }

  /**
   * Obter informações do sistema atual
   */
  getCurrentInfo() {
    return {
      wallet: this.currentWallet,
      adapter: this.currentAdapter ? this.currentAdapter.constructor.name : null,
      isInitialized: !!this.currentAdapter,
      isConnected: this.currentAdapter?.isConnected || false,
      address: this.currentAdapter?.address || null,
      walletType: this.currentWallet?.name || null
    };
  }

  /**
   * Reset do sistema
   */
  async reset() {
    console.log('🔄 [UTM] Resetando sistema...');
    this.currentAdapter = null;
    this.currentWallet = null;
    await this.initialize();
  }

  /**
   * Health check do sistema
   */
  async healthCheck() {
    try {
      if (!this.currentAdapter) {
        return { status: 'NOT_INITIALIZED', message: 'Sistema não inicializado' };
      }
      
      const walletInfo = await WalletRouter.getWalletInfo(this.currentWallet);
      
      return {
        status: 'HEALTHY',
        wallet: this.currentWallet.name,
        isConnected: walletInfo.isConnected,
        accounts: walletInfo.accounts,
        chainId: walletInfo.chainId
      };
    } catch (error) {
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  }
}

// Singleton instance
export const universalTransactionManager = new UniversalTransactionManager();
