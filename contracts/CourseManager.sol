// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import {YDBalanceRegistry} from './YDBalanceRegistry.sol';

/// @title Course Manager
/// @notice Manages on-chain course metadata and distributes YD rewards.
/// @dev 负责记录课程信息，并与 YDBalanceRegistry 联动发放/扣除代币。
contract CourseManager is Ownable, ReentrancyGuard {
    uint256 public constant CREATOR_REWARD = 100 * 1e18;

    struct Course {
        uint256 id;
        address creator;
        string name;
        string description;
        uint256 priceWei;
        string category;
        string contentUri;
    }

    uint256 public nextCourseId = 1;
    mapping(uint256 => Course) public courses;
    mapping(address => mapping(uint256 => bool)) public hasPurchased;
    YDBalanceRegistry public immutable balanceRegistry;

    event CourseCreated(uint256 indexed id, address indexed creator, string name, uint256 priceWei);
    event CourseUpdated(uint256 indexed id, uint256 priceWei, string contentUri);
    event CoursePurchased(uint256 indexed id, address indexed buyer, uint256 priceWei);

    constructor(address registry) Ownable(msg.sender) {
        require(registry != address(0), 'Invalid registry');
        balanceRegistry = YDBalanceRegistry(registry);
    }

    /// @notice 创作者创建课程，写入链上元数据并获得固定 YD 奖励。
    function createCourse(
        string calldata name,
        string calldata description,
        uint256 priceWei,
        string calldata category,
        string calldata contentUri
    ) external returns (uint256) {
        require(priceWei > 0, 'Price must be > 0');
        require(bytes(name).length > 0, 'Name required');

        uint256 courseId = nextCourseId++;
        courses[courseId] = Course({
            id: courseId,
            creator: msg.sender,
            name: name,
            description: description,
            priceWei: priceWei,
            category: category,
            contentUri: contentUri
        });

        balanceRegistry.increase(msg.sender, CREATOR_REWARD);
        emit CourseCreated(courseId, msg.sender, name, priceWei);
        return courseId;
    }

    /// @notice 修改课程价格、内容链接。
    function updateCourse(uint256 courseId, uint256 priceWei, string calldata contentUri) external {
        Course storage course = courses[courseId];
        require(course.creator == msg.sender, 'Only creator');
        require(priceWei > 0, 'Price must be > 0');
        course.priceWei = priceWei;
        course.contentUri = contentUri;
        emit CourseUpdated(courseId, priceWei, contentUri);
    }

    /// @notice 购买课程并把 YD 余额从买家转给创作者。
    /// @dev 同时处理 ETH 支付、代币账本变更与退款。
    function purchaseCourse(uint256 courseId) external payable nonReentrant {
        Course storage course = courses[courseId];
        require(course.creator != address(0), 'Course missing');
        require(!hasPurchased[msg.sender][courseId], 'Already purchased');
        require(msg.value >= course.priceWei, 'Insufficient payment');

        hasPurchased[msg.sender][courseId] = true;
        balanceRegistry.decrease(msg.sender, course.priceWei);
        balanceRegistry.increase(course.creator, course.priceWei);
        emit CoursePurchased(courseId, msg.sender, course.priceWei);

        (bool success, ) = course.creator.call{value: course.priceWei}('');
        require(success, 'Transfer failed');

        uint256 refund = msg.value - course.priceWei;
        if (refund > 0) {
            (bool refundOk, ) = msg.sender.call{value: refund}('');
            require(refundOk, 'Refund failed');
        }
    }

    function courseExists(uint256 courseId) external view returns (bool) {
        return courses[courseId].creator != address(0);
    }
}
