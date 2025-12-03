// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import {YDBalanceRegistry} from './YDBalanceRegistry.sol';

/// @title YD Platform Token
/// @notice Platform utility token with capped supply that can be purchased with ETH.
/// @dev 通过 ETH 购买、奖励或燃烧都会同步到 YDBalanceRegistry，方便前端读取。
contract YDPlatformToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 10_000 * 1e18;
    uint256 public tokenPrice = 0.01 ether;
    YDBalanceRegistry public immutable balanceRegistry;

    event TokenPriceUpdated(uint256 newPrice);
    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethCost);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event EtherWithdrawn(address indexed to, uint256 amount);

    constructor(address registry) ERC20('YD Platform Token', 'YDT') Ownable(msg.sender) {
        require(registry != address(0), 'Invalid registry');
        balanceRegistry = YDBalanceRegistry(registry);
    }

    /// @notice Owner can adjust the ETH price per token (18 decimals).
    /// @dev 平台方可调节代币单价，单位为 ETH。
    /// @notice Owner can adjust the ETH price per token (18 decimals).
    function setTokenPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, 'Price must be > 0');
        tokenPrice = newPrice;
        emit TokenPriceUpdated(newPrice);
    }

    /// @notice Mint new tokens to an address. Respects the max supply.
    /// @notice Mint new tokens and sync the ledger (used for rewards).
    /// @dev 创作者奖励等场景会调用该方法。
    function mint(address to, uint256 amount) external onlyOwner {
        _safeMint(to, amount);
        balanceRegistry.increase(to, amount);
        emit TokensMinted(to, amount);
    }

    /// @notice Users can burn their tokens to reduce supply.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        balanceRegistry.decrease(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /// @notice Buy tokens with ETH using the current token price.
    /// @notice Buy tokens with ETH using the current token price.
    /// @dev Excess ETH is refunded and the ledger is updated.
    /// @dev 用户通过该交易购买，超额支付的 ETH 会退回。
    function buyTokens() public payable nonReentrant {
        require(msg.value >= tokenPrice, 'Insufficient ETH');
        uint256 remaining = MAX_SUPPLY - totalSupply();
        require(remaining > 0, 'Sold out');

        uint256 decimalsFactor = 10 ** decimals();
        uint256 tokensToMint = (msg.value * decimalsFactor) / tokenPrice;
        if (tokensToMint > remaining) {
            tokensToMint = remaining;
        }
        require(tokensToMint > 0, 'Amount too small');

        uint256 requiredCost = (tokensToMint * tokenPrice) / decimalsFactor;
        _safeMint(msg.sender, tokensToMint);
        balanceRegistry.increase(msg.sender, tokensToMint);
        emit TokensPurchased(msg.sender, tokensToMint, requiredCost);

        uint256 refund = msg.value - requiredCost;
        if (refund > 0) {
            (bool success, ) = msg.sender.call{value: refund}('');
            require(success, 'Refund failed');
        }
    }

    /// @notice Withdraw accumulated ETH from sales.
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), 'Invalid address');
        require(amount <= address(this).balance, 'Insufficient balance');
        (bool success, ) = to.call{value: amount}('');
        require(success, 'Withdraw failed');
        emit EtherWithdrawn(to, amount);
    }

    /// @notice Remaining mintable supply.
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    function _safeMint(address to, uint256 amount) internal {
        require(totalSupply() + amount <= MAX_SUPPLY, 'Exceeds max supply');
        _mint(to, amount);
    }

    receive() external payable {
        buyTokens();
    }

    fallback() external payable {
        revert('Unsupported');
    }
}
