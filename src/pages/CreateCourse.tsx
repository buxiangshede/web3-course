import { FormEvent, useState } from 'react'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'

import { getContractAddress } from '../config/contracts'
import { courseManagerAbi, ydTokenAbi } from '../lib/abi'
import { Toast } from '../components/Toast'

const initialForm = {
  name: '',
  description: '',
  price: '',
  category: '进阶',
  contentUrl: '',
}

export const CreateCourse = () => {
  const { address } = useAccount()
  const chainId = useChainId()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<string>('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { writeContractAsync, isPending } = useWriteContract()
  const { writeContractAsync: rewardAsync } = useWriteContract()
  const contractAddress = (getContractAddress('CourseManager', chainId) ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`
  const hasContract =
    contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000'
  const ydTokenAddress = (getContractAddress('YDPlatformToken', chainId) ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`
  const rewardEnabled =
    ydTokenAddress && ydTokenAddress !== '0x0000000000000000000000000000000000000000'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasContract) {
      setStatus('请在 .env 中配置 COURSE_MANAGER_ADDRESS 以调用合约')
      return
    }

    const price = form.price || '0'
    if (Number(price) <= 0) {
      setStatus('请输入正确的课程价格')
      return
    }

    const submitTx = async () => {
      setStatus('正在发送创建交易...')
      try {
        const tx = await writeContractAsync({
          address: contractAddress,
          abi: courseManagerAbi,
          functionName: 'createCourse',
          args: [
            form.name,
            form.description,
            parseEther(price),
            form.category,
            form.contentUrl,
          ],
        })
        setStatus(`🎉 课程创建交易已提交: ${tx}`)
        setForm(initialForm)

        if (rewardEnabled && address) {
          try {
            const rewardTx = await rewardAsync({
              address: ydTokenAddress,
              abi: ydTokenAbi,
              functionName: 'mint',
              args: [address as `0x${string}`, parseEther('100')],
            })
            setStatus((prev) => `${prev}\n🎁 已触发奖励 100 YD (tx: ${rewardTx})`)
            setToast({ type: 'success', message: '课程创建成功，已奖励 100 YD' })
          } catch (rewardError) {
            const message = rewardError instanceof Error ? rewardError.message : String(rewardError)
            setStatus((prev) => `${prev}\n⚠️ 奖励代币失败：${message}`)
            setToast({ type: 'error', message: '课程创建成功，但代币奖励失败' })
          }
        } else {
          setToast({ type: 'success', message: '课程创建交易已提交' })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setStatus(`创建失败: ${message}`)
        setToast({ type: 'error', message })
      }
    }

    submitTx()
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-card">
        <h2 className="text-2xl font-semibold text-primary">创建课程</h2>
        <p className="mt-2 text-sm text-slate-600">
          合约会部署课程 NFT，所有元数据直接写入链上。Creator 地址：{address ?? '未连接'}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-card">
          {[
            { label: '课程名称', name: 'name', placeholder: '例如：智能合约安全特训营' },
            { label: '描述', name: 'description', placeholder: '课程亮点、收益、适合人群' },
            { label: '价格（YD）', name: 'price', placeholder: '例如：320' },
            { label: '内容连接', name: 'contentUrl', placeholder: 'ipfs:// 或 HTTPS 链接' },
          ].map((field) => (
            <label key={field.name} className="block text-sm text-slate-600">
              {field.label}
              <input
                required
                value={(form as any)[field.name]}
                onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                placeholder={field.placeholder}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-surface-muted px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          ))}

          <label className="block text-sm text-slate-600">
            分类
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-surface-muted px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {['零基础', '进阶', '专家'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
          >
            {isPending ? '提交中...' : '提交并部署课程合约'}
          </button>
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </form>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-card">
          <h3 className="text-lg font-semibold text-primary">流程说明</h3>
          <ol className="space-y-3">
            <li>1. wagmi 生成 metadata 并上传到 IPFS / Arweave。</li>
            {/* <li>2. RainbowKit 调起 Creator 钱包签名，调用 CourseManager 合约。</li> */}
            <li>3. 推荐页直接从 CourseManager 读取课程信息。</li>
          </ol>
          <div className="rounded-2xl border border-slate-100 bg-surface-muted p-4">
            <p className="text-xs text-slate-500">提示</p>
            <p className="mt-2 text-slate-600">
              若需多链部署，可通过 WalletConnect 连接硬件钱包，config 中默认支持 Mainnet
            </p>
          </div>
        </aside>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
