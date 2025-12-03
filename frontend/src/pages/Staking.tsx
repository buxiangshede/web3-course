import { FormEvent, useMemo, useState } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { erc20Abi, formatEther, formatUnits, parseEther } from 'viem'

import { getContractAddress } from '../config/contracts'
import { stakingTreasuryAbi } from '../lib/abi'
import { Toast } from '../components/Toast'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const STAKING_PRODUCTS = {
  eth: { id: 'eth', asset: 'ETH', apy: 12, lockDays: 30, minAmount: '0.1' },
  yd: { id: 'yd', asset: 'YD', apy: 18, lockDays: 60, minAmount: '50' },
} as const

export const Staking = () => {
  const { address, chain } = useAccount()
  const [productId, setProductId] = useState<keyof typeof STAKING_PRODUCTS>('eth')
  const [amount, setAmount] = useState('')
  const { writeContractAsync, isPending } = useWriteContract()
  const { writeContractAsync: approveAsync } = useWriteContract()
  const activeChainId = chain?.id ?? 31337
  const stakingContract = (getContractAddress('StakingTreasury', activeChainId) ??
    ZERO_ADDRESS) as `0x${string}`
  const hasStakingContract =
    stakingContract && stakingContract !== '0x0000000000000000000000000000000000000000'
  const ydTokenAddress = (getContractAddress('YDPlatformToken', activeChainId) ??
    ZERO_ADDRESS) as `0x${string}`

  const selectedProduct = STAKING_PRODUCTS[productId]
  const expectedYield = amount
    ? (Number(amount) * (selectedProduct.apy / 100) * (selectedProduct.lockDays / 365)).toFixed(4)
    : '0.0000'
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: rawPosition } = useReadContract({
    address: hasStakingContract ? stakingContract : undefined,
    abi: stakingTreasuryAbi,
    functionName: 'positions',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) && hasStakingContract },
  })

  const stakingPositions = useMemo(() => {
    const ethAmount = rawPosition ? Number(formatEther(rawPosition[0] as bigint)) : 0
    const ydAmount = rawPosition ? Number(formatUnits(rawPosition[1] as bigint, 18)) : 0
    return [
      {
        label: 'ETH 流动性池',
        token: 'ETH',
        amount: ethAmount,
        apy: STAKING_PRODUCTS.eth.apy,
      },
      {
        label: 'YD 稳健池',
        token: 'YD',
        amount: ydAmount,
        apy: STAKING_PRODUCTS.yd.apy,
      },
    ].map((item) => ({
      ...item,
      profit: (item.amount * item.apy) / 100,
    }))
  }, [rawPosition])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasStakingContract) {
      alert('请配置 STAKING_CONTRACT_ADDRESS 以调用合约')
      return
    }

    if (!amount || Number(amount) <= 0) {
      alert('请输入有效的质押数量')
      return
    }
    if (productId === 'yd' && (!ydTokenAddress || ydTokenAddress === ZERO_ADDRESS)) {
      alert('请先在 .env 中配置 YD_TOKEN_ADDRESS')
      return
    }

    try {
      let tx: unknown
      if (productId === 'eth') {
        tx = await writeContractAsync({
          address: stakingContract,
          abi: stakingTreasuryAbi,
          functionName: 'depositEth',
          value: parseEther(amount),
        })
      } else {
        const parsedAmount = parseEther(amount)
        await approveAsync({
          address: ydTokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [stakingContract, parsedAmount],
        })
        tx = await writeContractAsync({
          address: stakingContract,
          abi: stakingTreasuryAbi,
          functionName: 'depositYd',
          args: [parsedAmount],
        })
      }
      setToast({
        type: 'success',
        message: productId === 'eth' ? '已提交 ETH 质押交易' : '已提交 YD 质押交易',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setToast({ type: 'error', message })
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-card">
        <h2 className="text-2xl font-semibold text-primary">质押理财</h2>
        <p className="text-sm text-slate-600">
          直接调用 StakingTreasury 合约进行资金入金/赎回，数据同步至个人中心。
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-card">
          <label className="block text-sm text-slate-600">
            选择质押产品
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value as keyof typeof STAKING_PRODUCTS)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-surface-muted px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {Object.values(STAKING_PRODUCTS).map((item) => (
                <option key={item.id} value={item.id} className="bg-white text-primary">
                  {item.asset} · APY {item.apy}% · {item.lockDays} 天锁定
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-600">
            质押数量（最少 {selectedProduct.minAmount}）
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={`输入 ${selectedProduct.asset} 数量`}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-surface-muted px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          <div className="rounded-2xl border border-slate-100 bg-surface-muted p-4 text-sm text-slate-600">
            <p>
              预估年化收益：<span className="text-primary">{selectedProduct.apy}%</span>
            </p>
            <p className="mt-2">
              周期收益：≈ {expectedYield} {selectedProduct.asset}
            </p>
            <p className="text-xs text-slate-500">提交后可在右侧列表实时查看仓位收益。</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? '提交中...' : '提交质押至合约'}
          </button>
        </form>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-card">
          <h3 className="text-lg font-semibold text-primary">已购理财产品</h3>
          {stakingPositions.every((item) => item.amount === 0) && (
            <p className="text-sm text-slate-500">暂无质押记录，完成入金后这里将展示收益。</p>
          )}
          <ul className="space-y-3">
            {stakingPositions.map((item) => (
              <li key={item.label} className="rounded-2xl border border-slate-100 bg-surface-muted p-4">
                <p className="text-primary">{item.label}</p>
                <p className="text-xs text-slate-500">年化 APY {item.apy}%</p>
                <p className="mt-2 text-sm">
                  持仓：<span className="font-semibold">{item.amount.toFixed(4)}</span> {item.token}
                </p>
                <p className="text-xs text-emerald-600">
                  预估年收益 ≈ {item.profit.toFixed(4)} {item.token}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </section>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
