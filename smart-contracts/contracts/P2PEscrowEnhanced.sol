// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title P2PEscrowEnhanced
 * @dev Enhanced P2P Escrow contract with dynamic fees and multi-party transactions
 * 
 * Features:
 * - Dynamic buyer fees (fixed R$5 up to R$100, 4% above)
 * - Time-based seller fee refunds
 * - Multiple fee collectors
 * - Automatic release after 72h
 * - Dispute resolution system
 */
contract P2PEscrowEnhanced is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable usdt;
    
    // 💰 FEE CONFIGURATION
    uint256 public constant SELLER_FEE_PERCENTAGE = 200; // 2%
    uint256 public constant BUYER_FEE_PERCENTAGE = 400; // 4% for boletos > R$100
    uint256 public constant FEE_DENOMINATOR = 10000; // Base 100%
    uint256 public constant FIXED_BUYER_FEE = 5 * 10**6; // R$ 5.00 in USDT (6 decimals)
    uint256 public constant BUYER_FEE_THRESHOLD = 100 * 10**6; // R$ 100.00 threshold
    
    // ⏰ TIME CONFIGURATION (in seconds)
    uint256 public constant UPLOAD_DEADLINE = 1 hours;
    uint256 public constant FULL_REFUND_PERIOD = 2 hours;
    uint256 public constant HALF_REFUND_PERIOD = 24 hours;
    uint256 public constant QUARTER_REFUND_PERIOD = 48 hours;
    uint256 public constant AUTO_RELEASE_PERIOD = 72 hours;

    // 📊 ENHANCED ESCROW STRUCTURE
    struct EnhancedEscrow {
        address seller;
        address buyer;
        uint256 boletoValue;        // Original boleto value
        uint256 sellerFee;          // Seller transaction fee (2%)
        uint256 buyerFee;           // Buyer fee (R$5 or 4%)
        uint256 createdAt;          // Block timestamp
        uint256 uploadDeadline;     // Upload deadline timestamp
        uint256 autoReleaseTime;    // Auto release timestamp
        bool isActive;
        bool isReleased;
        bool isDisputed;
        bool uploadeado;            // Comprovante uploaded
        EscrowStatus status;
    }

    enum EscrowStatus {
        CREATED,           // Escrow created, waiting for buyer
        BUYER_REGISTERED,  // Buyer registered, waiting for payment proof
        UPLOAD_COMPLETED,  // Payment proof uploaded
        RELEASED,          // Payment approved and released
        CANCELLED,         // Cancelled by seller
        EXPIRED,           // Upload deadline expired
        DISPUTED,          // In dispute resolution
        AUTO_RELEASED      // Automatically released after 72h
    }

    // 🗂️ STORAGE
    mapping(bytes32 => EnhancedEscrow) public escrows;
    mapping(address => bool) public authorizedDisputeResolvers;
    
    // 📊 EVENTS
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed seller,
        uint256 boletoId,
        uint256 boletoValue,
        uint256 sellerFee,
        uint256 buyerFee,
        uint256 createdAt
    );
    
    event BuyerRegistered(
        bytes32 indexed escrowId,
        address indexed buyer,
        uint256 timestamp
    );
    
    event PaymentProofUploaded(
        bytes32 indexed escrowId,
        address indexed buyer,
        uint256 timestamp
    );
    
    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed seller,
        address indexed buyer,
        uint256 boletoValue,
        uint256 sellerFeeRefunded,
        uint256 buyerFee,
        uint256 protocolEarnings,
        bool autoReleased
    );
    
    event EscrowCancelled(
        bytes32 indexed escrowId,
        address indexed seller,
        uint256 refundAmount,
        uint256 timestamp
    );

    event EscrowExpired(
        bytes32 indexed escrowId,
        address indexed seller,
        uint256 refundAmount,
        uint256 timestamp
    );
    
    event DisputeCreated(
        bytes32 indexed escrowId,
        address indexed initiator,
        uint256 timestamp
    );

    event DisputeResolved(
        bytes32 indexed escrowId,
        address indexed resolver,
        address indexed winner,
        uint256 timestamp
    );

    // 🚫 CUSTOM ERRORS
    error EscrowNotFound();
    error EscrowNotActive();
    error EscrowAlreadyReleased();
    error EscrowNotDisputed();
    error UnauthorizedDisputeResolver();
    error UploadDeadlinePassed();
    error UploadDeadlineNotPassed();
    error AutoReleaseNotReady();
    error InvalidBoletoValue();
    error InsufficientAllowance();
    error TransferFailed();

    /**
     * @dev Constructor
     * @param _usdtAddress USDT token contract address
     */
    constructor(address _usdtAddress) {
        usdt = IERC20(_usdtAddress);
        authorizedDisputeResolvers[msg.sender] = true;
    }

    /**
     * 💰 Calculate buyer fee based on boleto value
     * @param boletoValue Value of the boleto in USDT (6 decimals)
     * @return buyerFee Calculated buyer fee
     */
    function calculateBuyerFee(uint256 boletoValue) public pure returns (uint256 buyerFee) {
        if (boletoValue <= BUYER_FEE_THRESHOLD) {
            return FIXED_BUYER_FEE; // R$ 5.00 fixed
        } else {
            return (boletoValue * BUYER_FEE_PERCENTAGE) / FEE_DENOMINATOR; // 4%
        }
    }

    /**
     * ⏰ Calculate seller fee refund based on elapsed time
     * @param createdAt Escrow creation timestamp
     * @param currentTime Current timestamp
     * @param originalFee Original seller fee amount
     * @return refundAmount Amount to refund to seller
     */
    function calculateSellerRefund(
        uint256 createdAt, 
        uint256 currentTime, 
        uint256 originalFee
    ) public pure returns (uint256 refundAmount) {
        uint256 elapsed = currentTime - createdAt;
        
        if (elapsed <= FULL_REFUND_PERIOD) {
            return originalFee; // 100% refund
        } else if (elapsed <= HALF_REFUND_PERIOD) {
            return originalFee / 2; // 50% refund
        } else if (elapsed <= QUARTER_REFUND_PERIOD) {
            return originalFee / 4; // 25% refund
        } else {
            return 0; // No refund
        }
    }

    /**
     * 🏗️ Create enhanced escrow with dynamic fees
     * @param _boletoId Unique boleto identifier
     * @param _boletoValue Value of the boleto in USDT
     * @param _buyer Buyer address (can be updated later)
     */
    function createEnhancedEscrow(
        uint256 _boletoId,
        uint256 _boletoValue,
        address _buyer
    ) external nonReentrant whenNotPaused {
        if (_boletoValue == 0) revert InvalidBoletoValue();

        // Calculate fees
        uint256 sellerFee = (_boletoValue * SELLER_FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 buyerFee = calculateBuyerFee(_boletoValue);
        uint256 totalRequired = _boletoValue + sellerFee;

        // Check allowance
        if (usdt.allowance(msg.sender, address(this)) < totalRequired) {
            revert InsufficientAllowance();
        }

        // Generate escrow ID
        bytes32 escrowId = keccak256(
            abi.encodePacked(
                msg.sender,
                _buyer,
                _boletoId,
                block.timestamp
            )
        );

        // Transfer funds from seller
        if (!usdt.transferFrom(msg.sender, address(this), totalRequired)) {
            revert TransferFailed();
        }

        // Create enhanced escrow
        escrows[escrowId] = EnhancedEscrow({
            seller: msg.sender,
            buyer: _buyer,
            boletoValue: _boletoValue,
            sellerFee: sellerFee,
            buyerFee: buyerFee,
            createdAt: block.timestamp,
            uploadDeadline: block.timestamp + UPLOAD_DEADLINE,
            autoReleaseTime: block.timestamp + AUTO_RELEASE_PERIOD,
            isActive: true,
            isReleased: false,
            isDisputed: false,
            uploadeado: false,
            status: EscrowStatus.CREATED
        });

        emit EscrowCreated(
            escrowId,
            msg.sender,
            _boletoId,
            _boletoValue,
            sellerFee,
            buyerFee,
            block.timestamp
        );
    }

    /**
     * 👤 Register buyer for escrow
     * @param _escrowId Escrow identifier
     * @param _buyer New buyer address
     */
    function registerBuyer(bytes32 _escrowId, address _buyer) external nonReentrant {
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (msg.sender != escrow.seller) revert("Only seller can register buyer");

        escrow.buyer = _buyer;
        escrow.status = EscrowStatus.BUYER_REGISTERED;

        emit BuyerRegistered(_escrowId, _buyer, block.timestamp);
    }

    /**
     * 📤 Mark payment proof as uploaded
     * @param _escrowId Escrow identifier
     */
    function markPaymentProofUploaded(bytes32 _escrowId) external nonReentrant {
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) {
            revert("Only buyer or seller can mark upload");
        }
        if (block.timestamp > escrow.uploadDeadline) revert UploadDeadlinePassed();

        escrow.uploadeado = true;
        escrow.status = EscrowStatus.UPLOAD_COMPLETED;

        emit PaymentProofUploaded(_escrowId, escrow.buyer, block.timestamp);
    }

    /**
     * ✅ Approve payment and release escrow (seller action)
     * @param _escrowId Escrow identifier
     */
    function approvePayment(bytes32 _escrowId) external nonReentrant whenNotPaused {
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (msg.sender != escrow.seller) revert("Only seller can approve");
        if (escrow.isDisputed) revert("Cannot approve disputed escrow");

        _executeRelease(_escrowId, false);
    }

    /**
     * 🔄 Auto-release escrow after 72 hours
     * @param _escrowId Escrow identifier
     */
    function autoReleaseEscrow(bytes32 _escrowId) external nonReentrant {
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (block.timestamp < escrow.autoReleaseTime) revert AutoReleaseNotReady();
        if (!escrow.uploadeado) revert("Payment proof not uploaded");

        _executeRelease(_escrowId, true);
    }

    /**
     * 🔄 Internal function to execute release
     * @param _escrowId Escrow identifier
     * @param isAutoRelease Whether this is an automatic release
     */
    function _executeRelease(bytes32 _escrowId, bool isAutoRelease) internal {
        EnhancedEscrow storage escrow = escrows[_escrowId];

        // Calculate seller refund based on elapsed time
        uint256 sellerRefund = calculateSellerRefund(
            escrow.createdAt,
            block.timestamp,
            escrow.sellerFee
        );

        uint256 protocolEarnings = escrow.sellerFee - sellerRefund + escrow.buyerFee;

        // Mark as released
        escrow.isReleased = true;
        escrow.isActive = false;
        escrow.status = isAutoRelease ? EscrowStatus.AUTO_RELEASED : EscrowStatus.RELEASED;

        // Transfer boleto value to buyer
        if (!usdt.transfer(escrow.buyer, escrow.boletoValue)) {
            revert TransferFailed();
        }

        // Transfer seller refund (if any)
        if (sellerRefund > 0) {
            if (!usdt.transfer(escrow.seller, sellerRefund)) {
                revert TransferFailed();
            }
        }

        // Transfer protocol earnings to owner
        if (protocolEarnings > 0) {
            if (!usdt.transfer(owner(), protocolEarnings)) {
                revert TransferFailed();
            }
        }

        emit EscrowReleased(
            _escrowId,
            escrow.seller,
            escrow.buyer,
            escrow.boletoValue,
            sellerRefund,
            escrow.buyerFee,
            protocolEarnings,
            isAutoRelease
        );
    }

    /**
     * ❌ Cancel escrow (seller only, before upload deadline)
     * @param _escrowId Escrow identifier
     */
    function cancelEscrow(bytes32 _escrowId) external nonReentrant {
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (msg.sender != escrow.seller) revert("Only seller can cancel");
        if (escrow.uploadeado) revert("Cannot cancel after upload");

        uint256 refundAmount = escrow.boletoValue + escrow.sellerFee;

        escrow.isActive = false;
        escrow.status = EscrowStatus.CANCELLED;

        // Refund full amount to seller
        if (!usdt.transfer(escrow.seller, refundAmount)) {
            revert TransferFailed();
        }

        emit EscrowCancelled(_escrowId, escrow.seller, refundAmount, block.timestamp);
    }

    /**
     * ⏰ Expire escrow after upload deadline
     * @param _escrowId Escrow identifier
     */
    function expireEscrow(bytes32 _escrowId) external nonReentrant {
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (block.timestamp <= escrow.uploadDeadline) revert UploadDeadlineNotPassed();
        if (escrow.uploadeado) revert("Cannot expire after upload");

        uint256 refundAmount = escrow.boletoValue + escrow.sellerFee;

        escrow.isActive = false;
        escrow.status = EscrowStatus.EXPIRED;

        // Refund full amount to seller
        if (!usdt.transfer(escrow.seller, refundAmount)) {
            revert TransferFailed();
        }

        emit EscrowExpired(_escrowId, escrow.seller, refundAmount, block.timestamp);
    }

    /**
     * 🚨 Create dispute
     * @param _escrowId Escrow identifier
     */
    function createDispute(bytes32 _escrowId) external nonReentrant {
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (escrow.isDisputed) revert("Already disputed");
        if (msg.sender != escrow.seller && msg.sender != escrow.buyer) {
            revert("Only parties can create dispute");
        }

        escrow.isDisputed = true;
        escrow.status = EscrowStatus.DISPUTED;

        emit DisputeCreated(_escrowId, msg.sender, block.timestamp);
    }

    /**
     * ⚖️ Resolve dispute (authorized resolvers only)
     * @param _escrowId Escrow identifier
     * @param _winner Winner address (seller or buyer)
     */
    function resolveDispute(bytes32 _escrowId, address _winner) external nonReentrant {
        if (!authorizedDisputeResolvers[msg.sender]) revert UnauthorizedDisputeResolver();
        
        EnhancedEscrow storage escrow = escrows[_escrowId];
        
        if (!escrow.isActive) revert EscrowNotActive();
        if (escrow.isReleased) revert EscrowAlreadyReleased();
        if (!escrow.isDisputed) revert EscrowNotDisputed();

        escrow.isDisputed = false;
        escrow.isActive = false;
        escrow.isReleased = true;
        escrow.status = EscrowStatus.RELEASED;

        uint256 totalAmount = escrow.boletoValue + escrow.sellerFee;

        if (_winner == escrow.buyer) {
            // Buyer wins: gets boleto value, protocol gets both fees
            if (!usdt.transfer(escrow.buyer, escrow.boletoValue)) revert TransferFailed();
            if (!usdt.transfer(owner(), escrow.sellerFee + escrow.buyerFee)) revert TransferFailed();
        } else if (_winner == escrow.seller) {
            // Seller wins: gets full refund
            if (!usdt.transfer(escrow.seller, totalAmount)) revert TransferFailed();
        } else {
            revert("Invalid winner address");
        }

        emit DisputeResolved(_escrowId, msg.sender, _winner, block.timestamp);
    }

    /**
     * 👨‍⚖️ Add/remove dispute resolver
     * @param _resolver Resolver address
     * @param _authorized Authorization status
     */
    function setDisputeResolver(address _resolver, bool _authorized) external onlyOwner {
        authorizedDisputeResolvers[_resolver] = _authorized;
    }

    /**
     * 📊 Get escrow details
     * @param _escrowId Escrow identifier
     * @return escrow Enhanced escrow details
     */
    function getEscrowDetails(bytes32 _escrowId) external view returns (EnhancedEscrow memory) {
        return escrows[_escrowId];
    }

    /**
     * 🕐 Check if auto-release is available
     * @param _escrowId Escrow identifier
     * @return canAutoRelease Whether auto-release is available
     */
    function canAutoRelease(bytes32 _escrowId) external view returns (bool canAutoRelease) {
        EnhancedEscrow memory escrow = escrows[_escrowId];
        return escrow.isActive && 
               !escrow.isReleased && 
               escrow.uploadeado && 
               block.timestamp >= escrow.autoReleaseTime;
    }

    /**
     * 🚨 Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * 💰 Emergency withdrawal (only owner, when paused)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner whenPaused {
        IERC20(_token).transfer(owner(), _amount);
    }
}

