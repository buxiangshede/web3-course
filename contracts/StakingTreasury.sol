// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import {YDBalanceRegistry} from './YDBalanceRegistry.sol';

/// @title Staking Treasury
/// @notice 管理 ETH / YD 的质押仓位，并同步代币账本余额。
contract StakingTreasury is Ownable, ReentrancyGuard {
    IERC20 public immutable ydToken;
    YDBalanceRegistry public immutable balanceRegistry;

    struct StakePosition {
        uint256 ethAmount;
        uint256 ydAmount;
    }

    mapping(address => StakePosition) public positions;

    event DepositedETH(address indexed user, uint256 amount);
    event DepositedYD(address indexed user, uint256 amount);
    event WithdrawnETH(address indexed user, uint256 amount);
    event WithdrawnYD(address indexed user, uint256 amount);

    constructor(address ydTokenAddress, address registry) Ownable(msg.sender) {
        require(ydTokenAddress != address(0), 'Invalid token');
        require(registry != address(0), 'Invalid registry');
        ydToken = IERC20(ydTokenAddress);
        balanceRegistry = YDBalanceRegistry(registry);
    }

    /// @notice 质押 ETH，记录仓位但不影响 YD 余额。
    function depositEth() external payable nonReentrant {
        _handleEthDeposit(msg.sender, msg.value);
    }

    /// @notice 质押 YD，转入合约并减少用户账本余额。
    function depositYd(uint256 amount) external nonReentrant {
        require(amount > 0, 'Amount > 0');
        require(ydToken.transferFrom(msg.sender, address(this), amount), 'Transfer failed');
        positions[msg.sender].ydAmount += amount;
        balanceRegistry.decrease(msg.sender, amount);
        emit DepositedYD(msg.sender, amount);
    }

    function withdrawEth(uint256 amount) external nonReentrant {
        require(amount > 0, 'Amount > 0');
        StakePosition storage position = positions[msg.sender];
        require(position.ethAmount >= amount, 'Insufficient balance');
        position.ethAmount -= amount;
        (bool success, ) = msg.sender.call{value: amount}('');
        require(success, 'Withdraw failed');
        emit WithdrawnETH(msg.sender, amount);
    }

    /// @notice 赎回 YD，返还代币并恢复账本余额。
    function withdrawYd(uint256 amount) external nonReentrant {
        require(amount > 0, 'Amount > 0');
        StakePosition storage position = positions[msg.sender];
        require(position.ydAmount >= amount, 'Insufficient balance');
        position.ydAmount -= amount;
        require(ydToken.transfer(msg.sender, amount), 'Transfer failed');
        balanceRegistry.increase(msg.sender, amount);
        emit WithdrawnYD(msg.sender, amount);
    }

    function getPosition(address user) external view returns (StakePosition memory) {
        return positions[user];
    }

    receive() external payable {
        _handleEthDeposit(msg.sender, msg.value);
    }

    function _handleEthDeposit(address from, uint256 amount) internal {
        require(amount > 0, 'Send ETH');
        positions[from].ethAmount += amount;
        emit DepositedETH(from, amount);
    }
}
