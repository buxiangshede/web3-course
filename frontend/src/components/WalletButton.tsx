import { useState } from 'react'
import { formatEther } from 'viem'
import {
  useBalance,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi'

const shorten = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`

export const WalletButton = () => {
  const { address, chainId, chain, isConnecting } = useConnection()

  console.log('WalletButton', address, chainId, chain)

  const { connectAsync, isPending } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
  const connectors = useConnectors()
  const { data: balance } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  })
  const [error, setError] = useState<string | null>(null)

  const connectMetamask = async () => {
    setError(null)
    if (!connectors || connectors.length === 0) {
      setError('未检测到可用钱包')
      return
    }
    const connector = connectors.find((item) => item.id === 'injected') ?? connectors[0]
    if (!connector) {
      setError('未检测到可用钱包')
      return
    }
    try {
      await connectAsync({ connector })
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接钱包失败')
    }
  }


  if (!address) {
    return (
      <button
        id="wallet-connect-trigger"
        type="button"
        onClick={connectMetamask}
        className="rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
        disabled={isConnecting || isPending}
      >
        <span className="text-sm font-semibold text-white drop-shadow">
          {isConnecting || isPending ? '连接中...' : '连接 MetaMask'}
        </span>
      </button>
    )
  }

  const onDisconnect = async () => {
    try {
      if (!disconnectAsync) {
        setError('当前状态无法断开')
        return
      }
      await disconnectAsync()
    } catch (err) {
      setError(err instanceof Error ? err.message : '断开连接失败')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300">
      <span className="text-primary/255">{shorten(address)}</span>
      <span className="text-accent">{balance ? `${Number(formatEther(balance.value)).toFixed(3)} ETH` : '查询中'}</span>
      <button
        type="button"
        onClick={onDisconnect}
        className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400 transition hover:border-red-500 hover:text-red-400"
      >
        断开
      </button>
    </div>
  )
}
