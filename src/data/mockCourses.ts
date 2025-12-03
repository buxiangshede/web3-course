import { Course, PurchaseStep, StakingProduct, TokenBalance } from '../types/course'

export const mockCourses: Course[] = [
  {
    id: 'solidity-pro',
    title: 'Solidity 全栈开发实战',
    description: '掌握 YD 平台课程合约、ERC-20 与链上数据工具的完整流程。',
    priceYD: 520,
    cover: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    learners: 1280,
    category: '专家',
    tags: ['Solidity', 'GraphQL', 'DeFi'],
    contentUrl: 'ipfs://solidity-pro',
  },
  {
    id: 'defi-architect',
    title: 'DeFi 策略与风控',
    description: '跟随机构研究员完成收益聚合、AAVE 抵押与多链风控建模。',
    priceYD: 360,
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    learners: 980,
    category: '进阶',
    tags: ['AAVE', '风控', '收益策略'],
    contentUrl: 'ipfs://defi-architect',
  },
  {
    id: 'graph-analytics',
    title: 'The Graph 数据分析营',
    description: '构建数据索引、编写 Schema、通过 Viem 及 wagmi 调用链上课程数据。',
    priceYD: 280,
    cover: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    learners: 860,
    category: '进阶',
    tags: ['数据索引', 'Subgraph', '数据可视化'],
    contentUrl: 'ipfs://graph-analytics',
  },
]

export const purchaseSteps: PurchaseStep[] = [
  {
    title: '1. 购买平台 YD 代币',
    description: '连接 MetaMask / WalletConnect，选择法币或链上资产兑换平台代币。',
  },
  {
    title: '2. 授权课程合约',
    description: '通过 wagmi 自动发起 ERC-20 approve，授权 YD 代币给课程售卖合约。',
  },
  {
    title: '3. 支付完成学习',
    description: '使用 RainbowKit 支付组件完成交易，上链后自动解锁课程内容链接。',
  },
]

export const stakingProducts: StakingProduct[] = [
  { id: 'yd-stake', asset: 'YD', apy: 14.2, lockDays: 30, minAmount: 200, risk: '平衡型' },
  { id: 'eth-aave', asset: 'ETH', apy: 8.1, lockDays: 60, minAmount: 0.2, risk: '低风险' },
  { id: 'usdt-yield', asset: 'USDT', apy: 12.4, lockDays: 45, minAmount: 500, risk: '平衡型' },
]

export const sampleBalances: TokenBalance[] = [
  { symbol: 'YD', amount: 1320, usdValue: 1550 },
  { symbol: 'ETH', amount: 1.2, usdValue: 4200 },
  { symbol: 'USDT', amount: 850, usdValue: 850 },
]
