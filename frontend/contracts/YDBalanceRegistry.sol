// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

/// @title YD Balance Registry
/// @notice Records off-chain friendly token balances for multiple contracts.
/// @dev 用于追踪平台代币的“账本余额”，方便前端统一读取。
contract YDBalanceRegistry is Ownable {
    mapping(address => uint256) private balances;
    mapping(address => bool) public operators;

    event OperatorUpdated(address indexed operator, bool allowed);
    event BalanceIncreased(address indexed user, uint256 amount, uint256 newBalance);
    event BalanceDecreased(address indexed user, uint256 amount, uint256 newBalance);

    constructor() Ownable(msg.sender) {}

    modifier onlyOperator() {
        require(operators[msg.sender], 'Not operator');
        _;
    }

    /// @notice Allow another contract to mutate balances.
    /// @dev 只有被标记为 operator 的合约才能调用增减接口。
    function setOperator(address operator, bool allowed) external onlyOwner {
        operators[operator] = allowed;
        emit OperatorUpdated(operator, allowed);
    }

    /// @dev Called by operators after mint/purchase etc.
    /// @dev 例如奖励、购买完成后合约会调用该接口增加余额。
    function increase(address user, uint256 amount) external onlyOperator {
        require(user != address(0), 'Invalid user');
        balances[user] += amount;
        emit BalanceIncreased(user, amount, balances[user]);
    }

    /// @dev Called by operators after burn / spending.
    /// @dev 课程购买、改名扣费等场景会调用减少余额。
    function decrease(address user, uint256 amount) external onlyOperator {
        require(user != address(0), 'Invalid user');
        require(balances[user] >= amount, 'Insufficient balance');
        balances[user] -= amount;
        emit BalanceDecreased(user, amount, balances[user]);
    }

    /// @notice Exposed read-only API for front-end.
    /// @dev 前端直接调用该接口查询“平台认可”的 YD 余额。
    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }
}
