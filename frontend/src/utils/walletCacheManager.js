/**
 * 🗂️ Gerenciador de cache de carteira
 * Para limpar problemas de conexão com carteiras incorretas
 */

export const WalletCacheManager = {
  
  /**
   * 🧹 Limpar completamente cache de carteira
   */
  clearAllWalletCache() {
    console.log('🧹 [CACHE] Limpando cache de carteira...');
    
    // LocalStorage relacionado a carteiras
    const walletKeys = [
      'wallet_address',
      'last_connected_wallet',
      'preferred_wallet',
      'wallet_connection_data',
      'metamask_accounts',
      'rabby_accounts',
      'connected_account',
      'ethereum_accounts',
      'wallet_permissions'
    ];
    
    walletKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🗑️ [CACHE] Removendo: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // SessionStorage
    const sessionKeys = [
      'wallet_temp_connection',
      'current_account',
      'ethereum_provider'
    ];
    
    sessionKeys.forEach(key => {
      if (sessionStorage.getItem(key)) {
        console.log(`🗑️ [CACHE] Removendo session: ${key}`);
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ [CACHE] Cache de carteira limpo!');
  },

  /**
   * 🔄 Forçar reconnect completo
   */
  async forceWalletReconnect() {
    console.log('🔄 [CACHE] Forçando reconnect completo...');
    
    // Limpar cache
    this.clearAllWalletCache();
    
    // Revogar permissões se possível
    if (window.ethereum && window.ethereum.request) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
        console.log('✅ [CACHE] Permissões revogadas');
      } catch (error) {
        console.log('⚠️ [CACHE] Não foi possível revogar permissões:', error.message);
      }
    }
    
    console.log('🔄 [CACHE] Recarregue a página para reconnect completo');
  },

  /**
   * 📋 Verificar estado atual
   */
  getCurrentWalletState() {
    console.log('📋 [CACHE] Estado atual da carteira:');
    
    const walletKeys = [
      'wallet_address',
      'last_connected_wallet', 
      'connected_account'
    ];
    
    walletKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    // Verificar ethereum provider
    if (window.ethereum) {
      console.log('  ethereum provider:', window.ethereum.selectedAddress);
      console.log('  ethereum chainId:', window.ethereum.chainId);
    }
  }
};

export default WalletCacheManager;
