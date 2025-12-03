// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {YDBalanceRegistry} from './YDBalanceRegistry.sol';

/// @title Profile Registry
/// @notice 存储用户链上昵称，并在改名时扣除平台代币。
contract ProfileRegistry {
    uint256 public constant RENAME_FEE = 5 * 1e18;
    struct Profile {
        string displayName;
        string metadata;
        uint256 updatedAt;
    }

    mapping(address => Profile) private _profiles;
    YDBalanceRegistry public immutable balanceRegistry;

    event ProfileUpdated(address indexed user, string displayName, string metadata);

    constructor(address registry) {
        require(registry != address(0), 'Invalid registry');
        balanceRegistry = YDBalanceRegistry(registry);
    }

    /// @notice 通过改名需要支付固定 YD，费用实时扣除。
    function setProfile(string calldata displayName, string calldata metadata) external {
        balanceRegistry.decrease(msg.sender, RENAME_FEE);
        _profiles[msg.sender] = Profile({
            displayName: displayName,
            metadata: metadata,
            updatedAt: block.timestamp
        });
        emit ProfileUpdated(msg.sender, displayName, metadata);
    }

    function getProfile(address user) external view returns (Profile memory) {
        return _profiles[user];
    }
}
