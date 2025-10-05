/**
 * 🔗 SERVIÇO DE INTEGRAÇÃO COM SMART CONTRACT - BoletoXCrypto Produção
 * 
 * Gerencia interações com o smart contract BoletoEscrow
 * - Chama expireTransactions para boletos expirados
 * - Sincroniza status entre blockchain e banco
 * - Libera fundos automaticamente
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0 - Produção
 */

const { ethers } = require('ethers');

class SmartContractService {
  constructor() {
    // Configuração da rede Polygon Amoy
    this.PROVIDER_URL = 'https://rpc-amoy.polygon.technology';
    this.CHAIN_ID = 80002;
    
    // Endereços dos contratos
    this.P2P_ESCROW_ADDRESS = '0xe69C2630F4d52AF44C1A4CDE7D1552Cf1f97Cec2';
    this.MOCK_USDT_ADDRESS = '0x6A1068Dc06e723f7208932a781CbDfa95FEA76BD';
    
    // ABI simplificada do contrato BoletoEscrow
    this.ESCROW_ABI = [
      "function expireTransactions(bytes32[] calldata _transactionIds) external onlyOwner nonReentrant",
      "function getTransaction(bytes32 _transactionId) external view returns (tuple(bytes32 id, address seller, address buyer, uint256 usdtAmount, uint256 transactionFee, uint256 buyerFee, uint256 boletoId, uint256 createdAt, uint256 selectedAt, uint256 proofUploadedAt, uint256 completedAt, uint256 boleto__VencimentoTimestamp, uint8 status, bool fundsReleased, bool isEmergencyWithdraw))",
      "function boletoToTransaction(uint256 _boletoId) external view returns (bytes32)",
      "event TransactionCancelled(bytes32 indexed transactionId, address indexed seller, uint256 refundAmount, string reason)"
    ];
    
    this.provider = null;
    this.contract = null;
    this.isInitialized = false;
  }

  /**
   * 🚀 Inicializa conexão com blockchain
   */
  async initialize() {
    try {
      console.log('🔗 [SMART_CONTRACT] Inicializando conexão com blockchain...');
      
      // Configurar provider
      this.provider = new ethers.JsonRpcProvider(this.PROVIDER_URL);
      
      // Verificar conexão
      const network = await this.provider.getNetwork();
      console.log(`🔗 [SMART_CONTRACT] Conectado à rede: ${network.name} (Chain ID: ${network.chainId})`);
      
      if (Number(network.chainId) !== this.CHAIN_ID) {
        throw new Error(`Rede incorreta. Esperado: ${this.CHAIN_ID}, Atual: ${network.chainId}`);
      }
      
      // Configurar contrato (sem signer para operações readonly)
      this.contract = new ethers.Contract(this.P2P_ESCROW_ADDRESS, this.ESCROW_ABI, this.provider);
      
      this.isInitialized = true;
      console.log('✅ [SMART_CONTRACT] Inicialização concluída com sucesso');
      
      return true;
      
    } catch (error) {
      console.error('❌ [SMART_CONTRACT] Erro na inicialização:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * 🔍 Busca transação no smart contract por boleto ID
   */
  async getTransactionByBoletoId(boletoId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 [SMART_CONTRACT] Buscando transação para boleto ID: ${boletoId}`);
      
      // Buscar transaction ID pelo boleto ID
      const transactionId = await this.contract.boletoToTransaction(boletoId);
      
      if (transactionId === ethers.ZeroHash) {
        console.log(`⚠️ [SMART_CONTRACT] Nenhuma transação encontrada para boleto ${boletoId}`);
        return null;
      }
      
      console.log(`✅ [SMART_CONTRACT] Transaction ID encontrado: ${transactionId}`);
      
      // Buscar detalhes da transação
      const transaction = await this.contract.getTransaction(transactionId);
      
      return {
        transactionId: transactionId,
        seller: transaction.seller,
        buyer: transaction.buyer,
        usdtAmount: transaction.usdtAmount.toString(),
        transactionFee: transaction.transactionFee.toString(),
        buyerFee: transaction.buyerFee.toString(),
        boletoId: transaction.boletoId.toString(),
        createdAt: new Date(Number(transaction.createdAt) * 1000),
        selectedAt: new Date(Number(transaction.selectedAt) * 1000),
        proofUploadedAt: transaction.proofUploadedAt ? new Date(Number(transaction.proofUploadedAt) * 1000) : null,
        completedAt: transaction.completedAt ? new Date(Number(transaction.completedAt) * 1000) : null,
        status: Number(transaction.status),
        fundsReleased: transaction.fundsReleased
      };
      
    } catch (error) {
      console.error(`❌ [SMART_CONTRACT] Erro ao buscar transação para boleto ${boletoId}:`, error);
      return null;
    }
  }

  /**
   * ⏰ Verifica se transação está expirada no smart contract
   */
  async isTransactionExpired(boletoId) {
    try {
      const transaction = await this.getTransactionByBoletoId(boletoId);
      
      if (!transaction) {
        return { expired: false, reason: 'Transação não encontrada no contrato' };
      }
      
      const now = new Date();
      const selectedAt = transaction.selectedAt;
      const oneHour = 60 * 60 * 1000; // 1 hora em milissegundos
      
      // Verificar se passou de 60 minutos desde a seleção
      const timeSinceSelection = now.getTime() - selectedAt.getTime();
      const isExpired = timeSinceSelection > oneHour;
      
      return {
        expired: isExpired,
        timeSinceSelection: timeSinceSelection,
        timeSinceSelectionMinutes: Math.floor(timeSinceSelection / (1000 * 60)),
        reason: isExpired ? 'Excedeu 60 minutos desde a seleção' : 'Ainda dentro do prazo'
      };
      
    } catch (error) {
      console.error(`❌ [SMART_CONTRACT] Erro ao verificar expiração da transação ${boletoId}:`, error);
      return { expired: false, reason: 'Erro ao verificar expiração' };
    }
  }

  /**
   * 🔄 Expira transações no smart contract
   * NOTA: Requer chave privada do owner para executar
   */
  async expireTransactions(transactionIds) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔄 [SMART_CONTRACT] Tentando expirar ${transactionIds.length} transações...`);
      
      // Verificar se temos chave privada do owner
      if (!process.env.OWNER_PRIVATE_KEY) {
        console.log('⚠️ [SMART_CONTRACT] OWNER_PRIVATE_KEY não configurada - expiração manual necessária');
        console.log(`📋 [SMART_CONTRACT] Transaction IDs para expiração manual: ${transactionIds.join(', ')}`);
        return {
          success: false,
          reason: 'OWNER_PRIVATE_KEY não configurada',
          transactionIds: transactionIds
        };
      }
      
      // Configurar signer com chave privada do owner
      const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, this.provider);
      const contractWithSigner = this.contract.connect(wallet);
      
      // Executar expiração
      const tx = await contractWithSigner.expireTransactions(transactionIds);
      console.log(`🔄 [SMART_CONTRACT] Transação enviada: ${tx.hash}`);
      
      // Aguardar confirmação
      const receipt = await tx.wait();
      console.log(`✅ [SMART_CONTRACT] Transação confirmada: ${receipt.transactionHash}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        transactionIds: transactionIds
      };
      
    } catch (error) {
      console.error('❌ [SMART_CONTRACT] Erro ao expirar transações:', error);
      return {
        success: false,
        reason: error.message,
        transactionIds: transactionIds
      };
    }
  }

  /**
   * 📊 Obtém estatísticas do smart contract
   */
  async getContractStats() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        contractAddress: this.P2P_ESCROW_ADDRESS,
        network: {
          name: network.name,
          chainId: Number(network.chainId)
        },
        currentBlock: blockNumber,
        isInitialized: this.isInitialized,
        providerUrl: this.PROVIDER_URL
      };
      
    } catch (error) {
      console.error('❌ [SMART_CONTRACT] Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

module.exports = SmartContractService;
