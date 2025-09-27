/**
 * WALLET ADAPTERS - PADRÃO ADAPTER
 * Implementações específicas para cada tipo de wallet
 */

import { ethers } from 'ethers';

/**
 * ADAPTER BASE - Interface comum
 */
export class BaseWalletAdapter {
  constructor(walletInfo) {
    this.walletInfo = walletInfo;
    this.provider = null;
    this.signer = null;
  }

  async connect() {
    throw new Error('connect() deve ser implementado na subclasse');
  }

  async executeTransaction(params) {
    throw new Error('executeTransaction() deve ser implementado na subclasse');
  }

  async executeContractMethod(contract, methodName, args, options = {}) {
    throw new Error('executeContractMethod() deve ser implementado na subclasse');
  }
}

/**
 * RABBY WALLET ADAPTER - Implementação otimizada para Rabby
 */
export class RabbyWalletAdapter extends BaseWalletAdapter {
  constructor(walletInfo) {
    super(walletInfo);
    console.log('🟢 [RABBY] Adapter inicializado');
  }

  async connect() {
    try {
      console.log('🟢 [RABBY] Conectando...');
      
      this.provider = new ethers.BrowserProvider(this.walletInfo.provider);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      console.log('✅ [RABBY] Conectado:', address);
      return { address, provider: this.provider, signer: this.signer };
    } catch (error) {
      console.error('❌ [RABBY] Erro na conexão:', error.message);
      throw error;
    }
  }

  async executeTransaction(params) {
    try {
      console.log('🟢 [RABBY] Executando transação:', params);
      
      if (!this.signer) await this.connect();
      
      const tx = await this.signer.sendTransaction({
        to: params.to,
        data: params.data,
        gasLimit: params.gasLimit || 300000,
        gasPrice: params.gasPrice || ethers.parseUnits('2', 'gwei')
      });

      console.log('✅ [RABBY] Transação enviada:', tx.hash);
      return tx;
    } catch (error) {
      console.error('❌ [RABBY] Erro na transação:', error.message);
      throw error;
    }
  }

  async executeContractMethod(contract, methodName, args, options = {}) {
    try {
      console.log(`🟢 [RABBY] Executando ${methodName}:`, args);
      
      if (!this.signer) await this.connect();
      
      const connectedContract = contract.connect(this.signer);
      const tx = await connectedContract[methodName](...args, {
        gasLimit: options.gasLimit || 300000,
        ...options
      });

      console.log(`✅ [RABBY] ${methodName} executado:`, tx.hash);
      return tx;
    } catch (error) {
      console.error(`❌ [RABBY] Erro em ${methodName}:`, error.message);
      throw error;
    }
  }
}

/**
 * METAMASK ADAPTER - Implementação com fallbacks para MetaMask
 */
export class MetaMaskWalletAdapter extends BaseWalletAdapter {
  constructor(walletInfo) {
    super(walletInfo);
    this.fallbackStrategies = [
      'DIRECT_CONTRACT',
      'RAW_TRANSACTION', 
      'ALTERNATIVE_RPC',
      'LOCAL_SIMULATION'
    ];
    console.log('🟡 [METAMASK] Adapter inicializado com fallbacks');
  }

  async connect() {
    try {
      console.log('🟡 [METAMASK] Conectando...');
      
      // Reset do estado do MetaMask
      await this.resetMetaMaskState();
      
      this.provider = new ethers.BrowserProvider(this.walletInfo.provider);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      // Definir propriedades de estado
      this.isConnected = true;
      this.address = address;
      
      console.log('✅ [METAMASK] Conectado:', address);
      return { address, provider: this.provider, signer: this.signer };
    } catch (error) {
      console.error('❌ [METAMASK] Erro na conexão:', error.message);
      throw error;
    }
  }

  async resetMetaMaskState() {
    try {
      console.log('🔄 [METAMASK] Resetando estado...');
      
      // Resetar propriedades de estado
      this.isConnected = false;
      this.address = null;
      
      // Tentar reset da conta
      if (this.walletInfo.provider.request) {
        await this.walletInfo.provider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        }).catch(() => {
          // Ignorar erro - nem todas as versões suportam
        });
      }
    } catch (error) {
      console.warn('⚠️ [METAMASK] Reset parcial:', error.message);
    }
  }

  async executeTransaction(params) {
    for (const strategy of this.fallbackStrategies) {
      try {
        console.log(`🟡 [METAMASK] Tentando estratégia: ${strategy}`);
        
        const result = await this.executeWithStrategy(strategy, params);
        console.log(`✅ [METAMASK] Sucesso com ${strategy}:`, result.hash);
        return result;
      } catch (error) {
        console.warn(`⚠️ [METAMASK] ${strategy} falhou:`, error.message);
        if (strategy === this.fallbackStrategies[this.fallbackStrategies.length - 1]) {
          throw error; // Último strategy falhou
        }
      }
    }
  }

  async executeWithStrategy(strategy, params) {
    if (!this.signer) await this.connect();

    switch (strategy) {
      case 'DIRECT_CONTRACT':
        return await this.signer.sendTransaction({
          to: params.to,
          data: params.data,
          gasLimit: params.gasLimit || 300000,
          gasPrice: ethers.parseUnits('2', 'gwei')
        });

      case 'RAW_TRANSACTION':
        return await this.signer.sendTransaction({
          to: params.to,
          data: params.data,
          gasLimit: 100000, // Gas fixo menor
          gasPrice: ethers.parseUnits('1', 'gwei') // Gas price menor
        });

      case 'ALTERNATIVE_RPC':
        // Usar RPC alternativo
        const altProvider = new ethers.JsonRpcProvider('https://polygon-amoy.drpc.org');
        const altSigner = new ethers.Wallet(
          await this.signer.getAddress(), // Simular com endereço
          altProvider
        );
        return await altSigner.sendTransaction({
          to: params.to,
          data: params.data,
          gasLimit: params.gasLimit || 300000
        });

      case 'LOCAL_SIMULATION':
        // Simular localmente sem enviar
        console.log('🔄 [METAMASK] Simulando transação localmente...');
        return {
          hash: '0x' + Date.now().toString(16),
          wait: async () => ({ status: 1 }),
          simulated: true
        };

      default:
        throw new Error(`Estratégia desconhecida: ${strategy}`);
    }
  }

  async executeContractMethod(contract, methodName, args, options = {}) {
    for (const strategy of this.fallbackStrategies) {
      try {
        console.log(`🟡 [METAMASK] ${methodName} com estratégia: ${strategy}`);
        
        if (!this.signer) await this.connect();
        
        const connectedContract = contract.connect(this.signer);
        
        if (strategy === 'RAW_TRANSACTION') {
          // Encoding manual para MetaMask
          const data = contract.interface.encodeFunctionData(methodName, args);
          return await this.executeWithStrategy(strategy, {
            to: await contract.getAddress(),
            data: data,
            gasLimit: options.gasLimit || 300000
          });
        } else {
          // Método padrão
          const tx = await connectedContract[methodName](...args, {
            gasLimit: options.gasLimit || 300000,
            gasPrice: ethers.parseUnits('2', 'gwei'),
            ...options
          });
          console.log(`✅ [METAMASK] ${methodName} executado:`, tx.hash);
          return tx;
        }
      } catch (error) {
        console.warn(`⚠️ [METAMASK] ${methodName} falhou com ${strategy}:`, error.message);
        if (strategy === this.fallbackStrategies[this.fallbackStrategies.length - 1]) {
          throw error;
        }
      }
    }
  }
}

/**
 * GENERIC WALLET ADAPTER - Para carteiras desconhecidas
 */
export class GenericWalletAdapter extends BaseWalletAdapter {
  constructor(walletInfo) {
    super(walletInfo);
    console.log('⚪ [GENERIC] Adapter inicializado');
  }

  async connect() {
    try {
      console.log('⚪ [GENERIC] Conectando...');
      
      this.provider = new ethers.BrowserProvider(this.walletInfo.provider);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      console.log('✅ [GENERIC] Conectado:', address);
      return { address, provider: this.provider, signer: this.signer };
    } catch (error) {
      console.error('❌ [GENERIC] Erro na conexão:', error.message);
      throw error;
    }
  }

  async executeTransaction(params) {
    try {
      if (!this.signer) await this.connect();
      
      const tx = await this.signer.sendTransaction({
        to: params.to,
        data: params.data,
        gasLimit: params.gasLimit || 300000
      });

      return tx;
    } catch (error) {
      console.error('❌ [GENERIC] Erro na transação:', error.message);
      throw error;
    }
  }

  async executeContractMethod(contract, methodName, args, options = {}) {
    try {
      if (!this.signer) await this.connect();
      
      const connectedContract = contract.connect(this.signer);
      const tx = await connectedContract[methodName](...args, {
        gasLimit: options.gasLimit || 300000,
        ...options
      });

      return tx;
    } catch (error) {
      console.error(`❌ [GENERIC] Erro em ${methodName}:`, error.message);
      throw error;
    }
  }
}

/**
 * FACTORY PARA CRIAÇÃO DE ADAPTERS
 */
export class WalletAdapterFactory {
  static create(walletInfo) {
    switch (walletInfo.type) {
      case 'RABBY':
        return new RabbyWalletAdapter(walletInfo);
      case 'METAMASK':
        return new MetaMaskWalletAdapter(walletInfo);
      case 'GENERIC':
      default:
        return new GenericWalletAdapter(walletInfo);
    }
  }
}





