export type CourseCategory = '零基础' | '进阶' | '专家'

export interface Course {
  id: string
  title: string
  description: string
  priceYD: number
  cover: string
  rating: number
  learners: number
  category: CourseCategory
  tags: string[]
  contentUrl: string
}

export interface PurchaseStep {
  title: string
  description: string
}

export type AssetSymbol = 'YD' | 'ETH' | 'USDT'

export interface StakingProduct {
  id: string
  asset: AssetSymbol
  apy: number
  lockDays: number
  minAmount: number
  risk: '低风险' | '平衡型' | '进取型'
}

export interface TokenBalance {
  symbol: AssetSymbol | 'MATIC' | 'ARB' | 'OP'
  amount: number
  usdValue: number
}
