// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract P2PEscrowV2 is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable usdt;
    uint256 public constant FEE_PERCENTAGE = 200; // 2%
    uint256 public constant FEE_DENOMINATOR = 10000; // Base 100%

    struct Escrow {
        address seller;
        address buyer;
        uint256 amount;
        uint256 fee;
        uint256 boletoId;
        bool isActive;
        bool isReleased;
    }

    mapping(bytes32 => Escrow) public escrows;
    
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed seller,
        uint256 boletoId,
        uint256 amount,
        uint256 fee
    );
    
    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        uint256 fee
    );
    
    event EscrowCancelled(
        bytes32 indexed escrowId,
        address indexed seller,
        uint256 amount,
        uint256 fee
    );

    constructor(address _usdt) {
        usdt = IERC20(_usdt);
    }

    function createEscrow(
        uint256 _boletoId,
        uint256 _amount,
        address _buyer
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_buyer != address(0), "Invalid buyer address");
        
        uint256 fee = (_amount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 totalAmount = _amount + fee;
        
        bytes32 escrowId = keccak256(
            abi.encodePacked(
                msg.sender,
                _buyer,
                _boletoId,
                block.timestamp
            )
        );
        
        require(!escrows[escrowId].isActive, "Escrow already exists");
        
        // Verificar se o contrato já tem os tokens (transferidos previamente)
        uint256 contractBalance = usdt.balanceOf(address(this));
        require(contractBalance >= totalAmount, "Insufficient USDT in contract");
        
        escrows[escrowId] = Escrow({
            seller: msg.sender,
            buyer: _buyer,
            amount: _amount,
            fee: fee,
            boletoId: _boletoId,
            isActive: true,
            isReleased: false
        });
        
        emit EscrowCreated(
            escrowId,
            msg.sender,
            _boletoId,
            _amount,
            fee
        );
        
        return escrowId;
    }

    function releaseEscrow(bytes32 _escrowId) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyOwner 
    {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.isActive, "Escrow not active");
        require(!escrow.isReleased, "Escrow already released");
        
        escrow.isActive = false;
        escrow.isReleased = true;
        
        // Transfer amount to buyer
        require(
            usdt.transfer(escrow.buyer, escrow.amount),
            "Transfer to buyer failed"
        );
        
        // Transfer fee to contract owner
        require(
            usdt.transfer(owner(), escrow.fee),
            "Fee transfer failed"
        );
        
        emit EscrowReleased(
            _escrowId,
            escrow.seller,
            escrow.buyer,
            escrow.amount,
            escrow.fee
        );
    }

    function cancelEscrow(bytes32 _escrowId) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyOwner 
    {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.isActive, "Escrow not active");
        require(!escrow.isReleased, "Escrow already released");
        
        escrow.isActive = false;
        
        uint256 totalAmount = escrow.amount + escrow.fee;
        
        // Return total amount to seller
        require(
            usdt.transfer(escrow.seller, totalAmount),
            "Transfer to seller failed"
        );
        
        emit EscrowCancelled(
            _escrowId,
            escrow.seller,
            escrow.amount,
            escrow.fee
        );
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency withdraw function
    function emergencyWithdraw(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(
            token.transfer(owner(), balance),
            "Emergency withdraw failed"
        );
    }
}

