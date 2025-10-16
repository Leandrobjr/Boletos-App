// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title BoletoEscrow
 * @dev Contrato inteligente para intermediação P2P entre vendedores (USDT) e compradores (Reais)
 * @author BoletoXCrypto Team
 * 
 * FLUXO PRINCIPAL:
 * 1. Vendedor cadastra boleto e trava USDT (valor + taxa de transação 2%)
 * 2. Comprador seleciona boleto e tem 1h para enviar comprovante
 * 3. Sistema verifica baixa do boleto e libera USDT conforme regras de tempo
 * 4. Taxas variam de acordo com tempo de baixa (2h, 24h, 48h, 72h)
 */
contract BoletoEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // CONSTANTES E CONFIGURAÇÕES
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    IERC20 public immutable usdt;
    address public feeRecipient; // Carteira específica da aplicação para receber taxas
    
    // Taxas em base points (1 bp = 0.01%)
    uint256 public constant TRANSACTION_FEE_PERCENTAGE = 200; // 2% taxa de transação
    uint256 public constant FEE_DENOMINATOR = 10000; // Base 100%
    uint256 public constant FIXED_FEE_USDT = 5 * 10**6; // R$ 5 convertido para USDT (6 decimais)
    uint256 public constant VARIABLE_FEE_PERCENTAGE = 400; // 4% para valores acima do limite
    uint256 public constant FIXED_FEE_LIMIT_USDT = 100 * 10**6; // R$ 100 convertido para USDT
    
    // Temporizadores (em segundos)
    uint256 public constant PROOF_UPLOAD_DEADLINE = 1 hours;
    uint256 public constant AUTO_RELEASE_DEADLINE = 72 hours;
    uint256 public constant INSTANT_RELEASE_WINDOW = 2 hours;
    uint256 public constant HALF_FEE_WINDOW = 24 hours;
    uint256 public constant QUARTER_FEE_WINDOW = 48 hours;
    
    // Limites de segurança
    uint256 public constant MAX_TRANSACTION_AMOUNT = 50000 * 10**6; // 50k USDT máximo
    uint256 public constant COOLDOWN_PERIOD = 5 minutes;
    uint256 public emergencyWithdrawDelay = 7 days;
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // ESTRUTURAS DE DADOS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    enum TransactionStatus {
        DISPONIVEL,           // 0 - Criado, aguardando seleção por comprador
        AGUARDANDO_PAGAMENTO, // 1 - Selecionado, aguardando upload de comprovante (1h)
        AGUARDANDO_BAIXA,     // 2 - Comprovante enviado, aguardando baixa do boleto
        BAIXADO,              // 3 - Finalizado com sucesso
        CANCELADO,            // 4 - Cancelado pelo vendedor
        VENCIDO,              // 5 - Expirado antes do pagamento
        DISPUTA               // 6 - Em disputa (requer intervenção manual)
    }
    
    struct Transaction {
        bytes32 id;                    // ID único da transação
        address seller;                // Vendedor (possui USDT)
        address buyer;                 // Comprador (quer USDT)
        uint256 usdtAmount;           // Valor principal em USDT
        uint256 transactionFee;       // Taxa de transação (2% do vendedor)
        uint256 buyerFee;             // Taxa do comprador
        uint256 boletoId;             // ID do boleto no sistema
        uint256 createdAt;            // Timestamp de criação
        uint256 selectedAt;           // Timestamp de seleção pelo comprador
        uint256 proofUploadedAt;      // Timestamp de upload do comprovante
        uint256 completedAt;          // Timestamp de finalização
        uint256 boleto__VencimentoTimestamp; // Timestamp de vencimento do boleto
        TransactionStatus status;      // Status atual
        bool fundsReleased;           // Se os fundos já foram liberados
        bool isEmergencyWithdraw;     // Marcador para retirada de emergência
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => uint256) public lastActionTimestamp;
    mapping(uint256 => bytes32) public boletoToTransaction; // boleto ID => transaction ID
    
    uint256 public totalTransactions;
    uint256 public totalVolumeUSDT;
    uint256 public totalFeesCollected;
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // EVENTOS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    event TransactionCreated(
        bytes32 indexed transactionId,
        address indexed seller,
        uint256 indexed boletoId,
        uint256 usdtAmount,
        uint256 transactionFee,
        uint256 buyerFee,
        uint256 vencimentoTimestamp
    );
    
    event TransactionSelected(
        bytes32 indexed transactionId,
        address indexed buyer,
        uint256 selectedAt,
        uint256 proofDeadline
    );
    
    event ProofUploaded(
        bytes32 indexed transactionId,
        address indexed buyer,
        uint256 uploadedAt,
        uint256 autoReleaseAt
    );
    
    event TransactionCompleted(
        bytes32 indexed transactionId,
        address indexed seller,
        address indexed buyer,
        uint256 amountToBuyer,
        uint256 feeToAdmin,
        uint256 refundToSeller,
        uint256 completedAt
    );
    
    event TransactionCancelled(
        bytes32 indexed transactionId,
        address indexed seller,
        uint256 refundAmount,
        string reason
    );
    
    event DisputeCreated(
        bytes32 indexed transactionId,
        address indexed initiator,
        string reason,
        uint256 createdAt
    );
    
    event EmergencyWithdraw(
        address indexed admin,
        address indexed token,
        uint256 amount,
        string reason
    );
    
    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient,
        address indexed updatedBy
    );
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // MODIFICADORES
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    modifier onlyTransactionParticipant(bytes32 _transactionId) {
        Transaction storage txn = transactions[_transactionId];
        require(
            msg.sender == txn.seller || msg.sender == txn.buyer,
            "BoletoEscrow: Apenas participantes da transacao"
        );
        _;
    }
    
    modifier onlySeller(bytes32 _transactionId) {
        require(
            transactions[_transactionId].seller == msg.sender,
            "BoletoEscrow: Apenas vendedor"
        );
        _;
    }
    
    modifier onlyBuyer(bytes32 _transactionId) {
        require(
            transactions[_transactionId].buyer == msg.sender,
            "BoletoEscrow: Apenas comprador"
        );
        _;
    }
    
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "BoletoEscrow: Valor deve ser maior que zero");
        require(_amount <= MAX_TRANSACTION_AMOUNT, "BoletoEscrow: Valor muito alto");
        _;
    }
    
    modifier cooldownPassed() {
        require(
            block.timestamp >= lastActionTimestamp[msg.sender].add(COOLDOWN_PERIOD),
            "BoletoEscrow: Aguarde o periodo de cooldown"
        );
        _;
    }
    
    modifier transactionExists(bytes32 _transactionId) {
        require(
            transactions[_transactionId].seller != address(0),
            "BoletoEscrow: Transacao nao existe"
        );
        _;
    }
    
    modifier inStatus(bytes32 _transactionId, TransactionStatus _status) {
        require(
            transactions[_transactionId].status == _status,
            "BoletoEscrow: Status invalido para esta operacao"
        );
        _;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    constructor(address _usdtAddress, address _feeRecipient) {
        require(_usdtAddress != address(0), "BoletoEscrow: Endereco USDT invalido");
        require(_feeRecipient != address(0), "BoletoEscrow: Endereco de taxas invalido");
        usdt = IERC20(_usdtAddress);
        feeRecipient = _feeRecipient;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // FUNÇÕES PRINCIPAIS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Vendedor cria nova transação travando USDT + taxa de transação
     * @param _boletoId ID único do boleto no sistema
     * @param _usdtAmount Valor principal em USDT (já convertido do real)
     * @param _boletoVencimentoTimestamp Timestamp de vencimento do boleto
     * @return transactionId ID da transação criada
     */
    function createTransaction(
        uint256 _boletoId,
        uint256 _usdtAmount,
        uint256 _boletoVencimentoTimestamp
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(_usdtAmount) 
        cooldownPassed 
        returns (bytes32 transactionId) 
    {
        require(
            _boletoVencimentoTimestamp > block.timestamp.add(1 days),
            "BoletoEscrow: Boleto deve vencer em pelo menos 1 dia"
        );
        require(
            boletoToTransaction[_boletoId] == bytes32(0),
            "BoletoEscrow: Boleto ja possui transacao ativa"
        );
        
        // Calcular taxas
        uint256 transactionFee = _usdtAmount.mul(TRANSACTION_FEE_PERCENTAGE).div(FEE_DENOMINATOR);
        uint256 buyerFee = calculateBuyerFee(_usdtAmount);
        uint256 totalToLock = _usdtAmount.add(transactionFee);
        
        // Gerar ID único da transação
        transactionId = keccak256(
            abi.encodePacked(
                msg.sender,
                _boletoId,
                _usdtAmount,
                block.timestamp,
                totalTransactions
            )
        );
        
        // Verificar se seller tem USDT suficiente e fazer transfer
        usdt.safeTransferFrom(msg.sender, address(this), totalToLock);
        
        // Criar transação
        transactions[transactionId] = Transaction({
            id: transactionId,
            seller: msg.sender,
            buyer: address(0),
            usdtAmount: _usdtAmount,
            transactionFee: transactionFee,
            buyerFee: buyerFee,
            boletoId: _boletoId,
            createdAt: block.timestamp,
            selectedAt: 0,
            proofUploadedAt: 0,
            completedAt: 0,
            boleto__VencimentoTimestamp: _boletoVencimentoTimestamp,
            status: TransactionStatus.DISPONIVEL,
            fundsReleased: false,
            isEmergencyWithdraw: false
        });
        
        // Mapear boleto para transação
        boletoToTransaction[_boletoId] = transactionId;
        
        // Atualizar estatísticas
        totalTransactions = totalTransactions.add(1);
        totalVolumeUSDT = totalVolumeUSDT.add(_usdtAmount);
        lastActionTimestamp[msg.sender] = block.timestamp;
        
        emit TransactionCreated(
            transactionId,
            msg.sender,
            _boletoId,
            _usdtAmount,
            transactionFee,
            buyerFee,
            _boletoVencimentoTimestamp
        );
        
        return transactionId;
    }
    
    /**
     * @dev Comprador seleciona boleto para pagamento
     * @param _transactionId ID da transação
     */
    function selectTransaction(bytes32 _transactionId) 
        external 
        nonReentrant 
        whenNotPaused 
        transactionExists(_transactionId)
        inStatus(_transactionId, TransactionStatus.DISPONIVEL)
        cooldownPassed
    {
        Transaction storage txn = transactions[_transactionId];
        
        require(
            msg.sender != txn.seller,
            "BoletoEscrow: Vendedor nao pode selecionar propria transacao"
        );
        require(
            block.timestamp < txn.boleto__VencimentoTimestamp.sub(1 days),
            "BoletoEscrow: Boleto muito proximo do vencimento"
        );
        
        // Atualizar transação
        txn.buyer = msg.sender;
        txn.selectedAt = block.timestamp;
        txn.status = TransactionStatus.AGUARDANDO_PAGAMENTO;
        
        // Atualizar cooldown
        lastActionTimestamp[msg.sender] = block.timestamp;
        
        uint256 proofDeadline = block.timestamp.add(PROOF_UPLOAD_DEADLINE);
        
        emit TransactionSelected(_transactionId, msg.sender, block.timestamp, proofDeadline);
    }
    
    /**
     * @dev Comprador confirma envio do comprovante de pagamento
     * @param _transactionId ID da transação
     */
    function uploadProof(bytes32 _transactionId) 
        external 
        nonReentrant 
        whenNotPaused 
        transactionExists(_transactionId)
        onlyBuyer(_transactionId)
        inStatus(_transactionId, TransactionStatus.AGUARDANDO_PAGAMENTO)
    {
        Transaction storage txn = transactions[_transactionId];
        
        require(
            block.timestamp <= txn.selectedAt.add(PROOF_UPLOAD_DEADLINE),
            "BoletoEscrow: Prazo para envio de comprovante expirado"
        );
        
        // Atualizar transação
        txn.proofUploadedAt = block.timestamp;
        txn.status = TransactionStatus.AGUARDANDO_BAIXA;
        
        uint256 autoReleaseAt = block.timestamp.add(AUTO_RELEASE_DEADLINE);
        
        emit ProofUploaded(_transactionId, msg.sender, block.timestamp, autoReleaseAt);
    }
    
    /**
     * @dev Vendedor autoriza baixa manual do boleto
     * @param _transactionId ID da transação
     */
    function manualRelease(bytes32 _transactionId) 
        external 
        nonReentrant 
        whenNotPaused 
        transactionExists(_transactionId)
        onlySeller(_transactionId)
        inStatus(_transactionId, TransactionStatus.AGUARDANDO_BAIXA)
    {
        _releaseTransaction(_transactionId, "Baixa manual pelo vendedor");
    }
    
    /**
     * @dev Sistema executa baixa automática após 72h
     * @param _transactionId ID da transação
     */
    function autoRelease(bytes32 _transactionId) 
        external 
        nonReentrant 
        whenNotPaused 
        transactionExists(_transactionId)
        inStatus(_transactionId, TransactionStatus.AGUARDANDO_BAIXA)
    {
        Transaction storage txn = transactions[_transactionId];
        
        require(
            block.timestamp >= txn.proofUploadedAt.add(AUTO_RELEASE_DEADLINE),
            "BoletoEscrow: Ainda dentro do prazo de baixa manual"
        );
        
        _releaseTransaction(_transactionId, "Baixa automatica apos 72h");
    }
    
    /**
     * @dev Cancela transação (apenas vendedor, apenas status DISPONIVEL)
     * @param _transactionId ID da transação
     */
    function cancelTransaction(bytes32 _transactionId) 
        external 
        nonReentrant 
        whenNotPaused 
        transactionExists(_transactionId)
        onlySeller(_transactionId)
        inStatus(_transactionId, TransactionStatus.DISPONIVEL)
    {
        Transaction storage txn = transactions[_transactionId];
        
        // Calcular valor total a retornar
        uint256 totalRefund = txn.usdtAmount.add(txn.transactionFee);
        
        // Atualizar status
        txn.status = TransactionStatus.CANCELADO;
        txn.completedAt = block.timestamp;
        txn.fundsReleased = true;
        
        // Limpar mapeamento de boleto
        delete boletoToTransaction[txn.boletoId];
        
        // Retornar USDT para vendedor
        usdt.safeTransfer(txn.seller, totalRefund);
        
        emit TransactionCancelled(_transactionId, txn.seller, totalRefund, "Cancelamento pelo vendedor");
    }
    
    /**
     * @dev Cria disputa (qualquer participante pode iniciar)
     * @param _transactionId ID da transação
     * @param _reason Motivo da disputa
     */
    function createDispute(bytes32 _transactionId, string memory _reason) 
        external 
        nonReentrant 
        whenNotPaused 
        transactionExists(_transactionId)
        onlyTransactionParticipant(_transactionId)
    {
        Transaction storage txn = transactions[_transactionId];
        
        require(
            txn.status == TransactionStatus.AGUARDANDO_BAIXA || 
            txn.status == TransactionStatus.AGUARDANDO_PAGAMENTO,
            "BoletoEscrow: Status invalido para criar disputa"
        );
        
        // Atualizar status para disputa
        txn.status = TransactionStatus.DISPUTA;
        
        emit DisputeCreated(_transactionId, msg.sender, _reason, block.timestamp);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // FUNÇÕES ADMINISTRATIVAS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Administrador resolve disputa
     * @param _transactionId ID da transação
     * @param _releaseToComprador Se true, libera para comprador; se false, retorna para vendedor
     * @param _reason Motivo da decisão
     */
    function resolveDispute(
        bytes32 _transactionId, 
        bool _releaseToComprador, 
        string memory _reason
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyOwner 
        transactionExists(_transactionId)
        inStatus(_transactionId, TransactionStatus.DISPUTA)
    {
        if (_releaseToComprador) {
            _releaseTransaction(_transactionId, string(abi.encodePacked("Disputa resolvida: ", _reason)));
        } else {
            // Retornar tudo para vendedor
            Transaction storage txn = transactions[_transactionId];
            uint256 totalRefund = txn.usdtAmount.add(txn.transactionFee);
            
            txn.status = TransactionStatus.CANCELADO;
            txn.completedAt = block.timestamp;
            txn.fundsReleased = true;
            
            delete boletoToTransaction[txn.boletoId];
            usdt.safeTransfer(txn.seller, totalRefund);
            
            emit TransactionCancelled(_transactionId, txn.seller, totalRefund, 
                string(abi.encodePacked("Disputa resolvida: ", _reason)));
        }
    }
    
    /**
     * @dev Força expiração de transações antigas
     * @param _transactionIds Array de IDs de transações
     */
    function forceExpireTransactions(bytes32[] memory _transactionIds) 
        external 
        onlyOwner 
        nonReentrant 
    {
        for (uint256 i = 0; i < _transactionIds.length; i++) {
            bytes32 txId = _transactionIds[i];
            Transaction storage txn = transactions[txId];
            
            if (txn.seller == address(0)) continue; // Transação não existe
            if (txn.fundsReleased) continue; // Já finalizada
            
            bool shouldExpire = false;
            
            // Verifica condições de expiração
            if (txn.status == TransactionStatus.DISPONIVEL && 
                block.timestamp >= txn.boleto__VencimentoTimestamp.sub(1 days)) {
                shouldExpire = true;
            } else if (txn.status == TransactionStatus.AGUARDANDO_PAGAMENTO && 
                       block.timestamp >= txn.selectedAt.add(PROOF_UPLOAD_DEADLINE).add(30 minutes)) {
                shouldExpire = true; // 30 min tolerância
            }
            
            if (shouldExpire) {
                uint256 totalRefund = txn.usdtAmount.add(txn.transactionFee);
                
                txn.status = TransactionStatus.VENCIDO;
                txn.completedAt = block.timestamp;
                txn.fundsReleased = true;
                
                delete boletoToTransaction[txn.boletoId];
                usdt.safeTransfer(txn.seller, totalRefund);
                
                emit TransactionCancelled(txId, txn.seller, totalRefund, "Transacao expirada");
            }
        }
    }
    
    /**
     * @dev Pausar contrato em emergência
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Despausar contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Atualizar endereço que recebe as taxas da aplicação
     * @param _newFeeRecipient Novo endereço para receber taxas
     */
    function setFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "BoletoEscrow: Endereco invalido");
        address oldRecipient = feeRecipient;
        feeRecipient = _newFeeRecipient;
        
        emit FeeRecipientUpdated(oldRecipient, _newFeeRecipient, msg.sender);
    }
    
    /**
     * @dev Retirada de emergência (apenas em casos extremos)
     * @param _tokenAddress Endereço do token
     * @param _amount Quantidade a retirar
     * @param _reason Motivo da retirada
     */
    function emergencyWithdraw(
        address _tokenAddress, 
        uint256 _amount, 
        string memory _reason
    ) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(paused(), "BoletoEscrow: Contrato deve estar pausado");
        require(_amount > 0, "BoletoEscrow: Valor deve ser maior que zero");
        
        IERC20 token = IERC20(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance >= _amount, "BoletoEscrow: Saldo insuficiente");
        
        token.safeTransfer(feeRecipient, _amount);
        
        emit EmergencyWithdraw(msg.sender, _tokenAddress, _amount, _reason);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // FUNÇÕES INTERNAS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Libera fundos da transação seguindo regras de tempo
     */
    function _releaseTransaction(bytes32 _transactionId, string memory /* _reason */) internal {
        Transaction storage txn = transactions[_transactionId];
        
        require(!txn.fundsReleased, "BoletoEscrow: Fundos ja liberados");
        
        uint256 timeSinceProof = block.timestamp.sub(txn.proofUploadedAt);
        
        // Calcular distribuição de taxas baseada no tempo
        uint256 sellerFeeRefund = 0;
        uint256 feeToAdmin = 0;
        
        if (timeSinceProof <= INSTANT_RELEASE_WINDOW) {
            // Até 2h: vendedor recebe 100% da taxa de volta
            sellerFeeRefund = txn.transactionFee;
            feeToAdmin = 0;
        } else if (timeSinceProof <= HALF_FEE_WINDOW) {
            // Até 24h: vendedor recebe 50% da taxa de volta
            sellerFeeRefund = txn.transactionFee.div(2);
            feeToAdmin = txn.transactionFee.div(2);
        } else if (timeSinceProof <= QUARTER_FEE_WINDOW) {
            // Até 48h: vendedor recebe 25% da taxa de volta
            sellerFeeRefund = txn.transactionFee.div(4);
            feeToAdmin = txn.transactionFee.mul(3).div(4);
        } else {
            // Após 48h: administrador fica com 100% da taxa
            sellerFeeRefund = 0;
            feeToAdmin = txn.transactionFee;
        }
        
        // Comprador recebe valor principal menos sua taxa
        uint256 amountToBuyer = txn.usdtAmount.sub(txn.buyerFee);
        
        // Administrador recebe taxas
        uint256 totalFeeToAdmin = feeToAdmin.add(txn.buyerFee);
        
        // Atualizar estado
        txn.status = TransactionStatus.BAIXADO;
        txn.completedAt = block.timestamp;
        txn.fundsReleased = true;
        
        // Limpar mapeamento
        delete boletoToTransaction[txn.boletoId];
        
        // Atualizar estatísticas
        totalFeesCollected = totalFeesCollected.add(totalFeeToAdmin);
        
        // Transferir fundos
        if (amountToBuyer > 0) {
            usdt.safeTransfer(txn.buyer, amountToBuyer);
        }
        if (totalFeeToAdmin > 0) {
            usdt.safeTransfer(feeRecipient, totalFeeToAdmin);
        }
        if (sellerFeeRefund > 0) {
            usdt.safeTransfer(txn.seller, sellerFeeRefund);
        }
        
        emit TransactionCompleted(
            _transactionId,
            txn.seller,
            txn.buyer,
            amountToBuyer,
            totalFeeToAdmin,
            sellerFeeRefund,
            block.timestamp
        );
    }
    
    /**
     * @dev Calcula taxa do comprador baseada no valor
     */
    function calculateBuyerFee(uint256 _usdtAmount) public pure returns (uint256) {
        if (_usdtAmount <= FIXED_FEE_LIMIT_USDT) {
            return FIXED_FEE_USDT; // R$ 5 em USDT
        } else {
            return _usdtAmount.mul(VARIABLE_FEE_PERCENTAGE).div(FEE_DENOMINATOR); // 4%
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // FUNÇÕES DE CONSULTA
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Retorna detalhes completos de uma transação
     */
    function getTransaction(bytes32 _transactionId) 
        external 
        view 
        returns (Transaction memory) 
    {
        return transactions[_transactionId];
    }
    
    /**
     * @dev Retorna ID da transação para um boleto
     */
    function getTransactionByBoleto(uint256 _boletoId) 
        external 
        view 
        returns (bytes32) 
    {
        return boletoToTransaction[_boletoId];
    }
    
    /**
     * @dev Verifica se pode fazer upload de comprovante
     */
    function canUploadProof(bytes32 _transactionId) 
        external 
        view 
        returns (bool) 
    {
        Transaction storage txn = transactions[_transactionId];
        
        return txn.status == TransactionStatus.AGUARDANDO_PAGAMENTO &&
               block.timestamp <= txn.selectedAt.add(PROOF_UPLOAD_DEADLINE);
    }
    
    /**
     * @dev Verifica se pode fazer baixa automática
     */
    function canAutoRelease(bytes32 _transactionId) 
        external 
        view 
        returns (bool) 
    {
        Transaction storage txn = transactions[_transactionId];
        
        return txn.status == TransactionStatus.AGUARDANDO_BAIXA &&
               block.timestamp >= txn.proofUploadedAt.add(AUTO_RELEASE_DEADLINE);
    }
    
    /**
     * @dev Retorna estatísticas do contrato
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 _totalTransactions,
            uint256 _totalVolumeUSDT,
            uint256 _totalFeesCollected,
            uint256 _contractBalance
        ) 
    {
        return (
            totalTransactions,
            totalVolumeUSDT,
            totalFeesCollected,
            usdt.balanceOf(address(this))
        );
    }
}
