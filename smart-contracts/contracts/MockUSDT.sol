// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing purposes on Polygon Amoy
 * @notice This is a test token with 6 decimals, not real USDT
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor() ERC20("Mock USDT", "USDT") Ownable() {
        _decimals = 6;
        
        // Mint 1,000,000 USDT (1,000,000 * 10^6) to the deployer
        uint256 initialSupply = 1000000 * 10**_decimals;
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mint tokens to a specific address (only owner)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from a specific address (only owner)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn (in wei)
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
