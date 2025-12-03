import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Address, formatUnits, parseEther } from 'viem'
import { useAccount, useBalance, useChainId, useReadContract, useSignMessage, useWriteContract } from 'wagmi'

import { getContractAddress } from '../config/contracts'
import { balanceRegistryAbi, profileRegistryAbi, ydTokenAbi } from '../lib/abi'
import { useCourseManager } from '../hooks/useCourseManager'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DECIMALS = BigInt(10) ** BigInt(18)
const ZERO_BIGINT = BigInt(0)
const RENAME_TOKEN_AMOUNT = '5'

export const Profile = () => {
  const { address, chain } = useAccount()
  const chainId = useChainId()
  const [displayName, setDisplayName] = useState('YD 学员')
  const [inputName, setInputName] = useState('YD 学员')
  const [buyAmount, setBuyAmount] = useState('200')
  const [signature, setSignature] = useState('')
  const [profileStatus, setProfileStatus] = useState('')
  const [buyStatus, setBuyStatus] = useState('')
  const { signMessageAsync, isPending } = useSignMessage()
  const { writeContractAsync: writeProfileAsync, isPending: isProfilePending } = useWriteContract()
  const { writeContractAsync: buyTokenAsync, isPending: isBuyingToken } = useWriteContract()
  const { purchasedCourses } = useCourseManager()
  const ydTokenAddress = (getContractAddress('YDPlatformToken', chainId) ??
    ZERO_ADDRESS) as `0x${string}`
  const balanceRegistryAddress = (getContractAddress('YDBalanceRegistry', chainId) ??
    ZERO_ADDRESS) as `0x${string}`
  const profileRegistryAddress = (getContractAddress('ProfileRegistry', chainId) ??
    ZERO_ADDRESS) as `0x${string}`

  const { data: nativeBalance } = useBalance({
    address,
    chainId: chain?.id,
    query: { enabled: Boolean(address) },
  })
  console.log('原生资产', nativeBalance)

  const shouldFetchYd = ydTokenAddress !== ZERO_ADDRESS
  const hasBalanceRegistry = balanceRegistryAddress !== ZERO_ADDRESS
  const { data: ledgerBalance, refetch: refetchLedgerBalance } = useReadContract({
    address: hasBalanceRegistry ? (balanceRegistryAddress as Address) : undefined,
    abi: balanceRegistryAbi,
    functionName: 'balanceOf',
    args: address ? [address as Address] : undefined,
    query: { enabled: Boolean(address) && hasBalanceRegistry },
  })
  console.log('ledgerBalance----', ledgerBalance)
  const { data: tokenPrice } = useReadContract({
    address: shouldFetchYd ? (ydTokenAddress as Address) : undefined,
    abi: ydTokenAbi,
    functionName: 'tokenPrice',
    query: { enabled: shouldFetchYd },
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('yd-display-name')
    if (stored) {
      setDisplayName(stored)
      setInputName(stored)
    }

    const handleBalanceRefresh = () => refetchLedgerBalance()
    const handleDisplayName = (event: Event) => {
      const custom = event as CustomEvent<string>
      if (custom.detail) {
        setDisplayName(custom.detail)
        setInputName(custom.detail)
      }
    }

    window.addEventListener('yd-balance-refresh', handleBalanceRefresh)
    window.addEventListener('yd-display-name-update', handleDisplayName as EventListener)
    return () => {
      window.removeEventListener('yd-balance-refresh', handleBalanceRefresh)
      window.removeEventListener('yd-display-name-update', handleDisplayName as EventListener)
    }
  }, [refetchLedgerBalance])

  const onRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!inputName) return
    if (!address) {
      setProfileStatus('请先连接钱包')
      return
    }
    const registryAddress = profileRegistryAddress
    if (!registryAddress || registryAddress === ZERO_ADDRESS) {
      setProfileStatus('请配置 PROFILE_REGISTRY_ADDRESS 以调用合约')
      return
    }
    if (!hasBalanceRegistry) {
      setProfileStatus('请配置 BALANCE_REGISTRY_ADDRESS 并确保可读取数据')
      return
    }

    try {
      const result = await signMessageAsync({ message: `YD Profile rename -> ${inputName}` })
      setSignature(result)

      setProfileStatus('正在扣除改名费用并提交...')
      await writeProfileAsync({
        address: registryAddress,
        abi: profileRegistryAbi,
        functionName: 'setProfile',
        args: [inputName, result],
      })
      setDisplayName(inputName)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('yd-display-name', inputName)
        window.dispatchEvent(new CustomEvent('yd-display-name-update', { detail: inputName }))
      }
      setProfileStatus('链上昵称已更新 ✅（已扣除改名费用）')
      refetchLedgerBalance()
      window.dispatchEvent(new Event('yd-balance-refresh'))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setProfileStatus(`更新失败: ${message}`)
    }
  }

  const estimatedCost = useMemo(() => {
    if (!tokenPrice) return '0.00'
    try {
      const amount = buyAmount.trim() ? parseEther(buyAmount) : ZERO_BIGINT
      if (amount <= ZERO_BIGINT) return '0.00'
      const cost = (amount * (tokenPrice as bigint)) / DECIMALS
      return Number(formatUnits(cost, 18)).toFixed(4)
    } catch (error) {
      return '0.00'
    }
  }, [tokenPrice, buyAmount])

  const onBuyToken = async () => {
    if (!address) {
      setBuyStatus('请先连接钱包')
      return
    }
    if (!shouldFetchYd || !tokenPrice) {
      setBuyStatus('请先在 .env 中配置 YD_TOKEN_ADDRESS 并确保合约已部署')
      return
    }
    try {
      const amountWei = parseEther(buyAmount || '0')
      if (amountWei <= ZERO_BIGINT) {
        setBuyStatus('请输入有效的购买数量')
        return
      }
      const cost = (amountWei * tokenPrice) / DECIMALS
      if (cost <= ZERO_BIGINT) {
        setBuyStatus('数量过小，无法完成购买')
        return
      }
      setBuyStatus('订单提交中...')
      await buyTokenAsync({
        address: ydTokenAddress,
        abi: ydTokenAbi,
        functionName: 'buyTokens',
        value: cost,
      })
      setBuyStatus(`已提交购买 ${buyAmount} YD，预计消耗 ${formatUnits(cost, 18)} ETH`)
      refetchLedgerBalance()
      window.dispatchEvent(new Event('yd-balance-refresh'))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setBuyStatus(`购买失败：${message}`)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-card">
          <p className="text-sm text-slate-500">钱包信息</p>
          <p className="mt-3 text-2xl font-semibold text-primary">{displayName}</p>
          <p className="mt-2 font-mono text-sm text-slate-500">{address ?? '未连接'}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>链：{chain?.name ?? '待连接'}</li>
            <li>
              原生资产：
              {nativeBalance
                ? `${formatUnits(nativeBalance.value, nativeBalance.decimals)} ${nativeBalance.symbol}`
                : '—'}
            </li>
            <li>
              YD 余额：
              {ledgerBalance && hasBalanceRegistry
                ? `${formatUnits(ledgerBalance as bigint, 18)}`
                : ledgerBalance} YD
            </li>
          </ul>
        </div>
        <form
          onSubmit={onRename}
          className="rounded-3xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-card"
        >
          <p className="text-primary">通过签名修改昵称</p>
          <input
            value={inputName}
            onChange={(event) => setInputName(event.target.value)}
            placeholder="输入新的展示名称"
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-surface-muted px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={isPending || isProfilePending}
            className="mt-4 w-full rounded-full bg-accent py-3 font-semibold text-white disabled:opacity-60"
          >
            {isPending || isProfilePending ? '签名 / 写入中...' : '提交签名'}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            改名需支付 {RENAME_TOKEN_AMOUNT} YD 等值费用，系统会自动完成代币购买与写入。
          </p>
          {signature && <p className="mt-3 break-all text-xs text-slate-500">最新签名：{signature}</p>}
          {profileStatus && <p className="mt-2 text-xs text-slate-500">{profileStatus}</p>}
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-card">
          <h3 className="text-lg font-semibold text-primary">购买平台 YD 代币</h3>
          <p className="text-sm text-slate-600">需先购代币再授权课程合约，可根据链上报价灵活调整。</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-xs uppercase tracking-wide text-slate-500">
              购买数量
              <input
                value={buyAmount}
                onChange={(event) => setBuyAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-surface-muted px-4 py-3 text-primary"
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-slate-500">
              估算成本 (ETH)
              <input
                value={estimatedCost}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-3 text-slate-500"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={onBuyToken}
            disabled={isBuyingToken}
            className="mt-5 w-full rounded-full bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isBuyingToken ? '链上购买中...' : '购买 YD'}
          </button>
          {buyStatus && <p className="mt-3 text-xs text-slate-500">{buyStatus}</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-card">
        <h3 className="text-lg font-semibold text-primary">已购课程</h3>
        {purchasedCourses.length === 0 && (
          <p className="mt-3 text-sm text-slate-600">暂无链上购买记录，完成购买后这里将实时显示。</p>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {purchasedCourses.map((course) => (
            <div key={course.id} className="rounded-2xl border border-slate-100 bg-surface-muted p-4 text-sm text-slate-600">
              <p className="text-primary">{course.title}</p>
              <p className="text-xs text-slate-500">价格：{course.priceYD} YD</p>
              <a href={course.contentUrl} target="_blank" rel="noreferrer" className="text-xs text-accent">
                查看内容
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
