import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { parseEther } from 'viem'
import { useAccount, useChainId, useWriteContract } from 'wagmi'

import { CourseCard } from '../components/CourseCard'
import { Toast } from '../components/Toast'
import { PurchaseFlow } from '../components/PurchaseFlow'
import { purchaseSteps } from '../data/mockCourses'
import { Course } from '../types/course'
import { useCourseManager } from '../hooks/useCourseManager'
import { courseManagerAbi } from '../lib/abi'
import { getContractAddress } from '../config/contracts'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const RecommendedCourses = () => {
  const { address } = useAccount()
  const chainId = useChainId()
  const { courses, purchasedCourses, isLoading } = useCourseManager()
  const { writeContractAsync, isPending: wagmiPurchasing } = useWriteContract()

  const [localPurchases, setLocalPurchases] = useState<Record<string, Course>>({})
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  console.log(chainId, 'chainId')
  const courseManager = (getContractAddress('CourseManager', chainId) ??
    ZERO_ADDRESS) as `0x${string}`
  const contractReady = courseManager && courseManager !== (ZERO_ADDRESS as `0x${string}`)
  const orderedCourses = useMemo(
    () => [...courses].sort((a, b) => Number(b.id) - Number(a.id)),
    [courses],
  )
  const purchasedSet = useMemo(() => {
    const ids = new Set<string>()
    purchasedCourses.forEach((course) => ids.add(course.id))
    Object.values(localPurchases).forEach((course) => ids.add(course.id))
    return ids
  }, [purchasedCourses, localPurchases])

  const handlePurchase = async (course: Course) => {
    console.log(chainId, 'chainId1')
    if (!address) {
      setFeedback({ type: 'error', message: '请先连接钱包再尝试购买。' })
      return
    }
    if (!contractReady) {
      setFeedback({ type: 'error', message: '课程合约地址未配置，请先完成部署。' })
      return
    }
    console.log(chainId, 'chainId2')
    try {
      setFeedback(null)
      setCurrentCourseId(course.id)
      await writeContractAsync({
        address: courseManager,
        abi: courseManagerAbi,
        functionName: 'purchaseCourse',
        args: [BigInt(course.id)],
        value: parseEther(course.priceYD.toString()),
      })
      console.log(chainId, 'chainId3')
      window.dispatchEvent(new Event('yd-balance-refresh'))
      setLocalPurchases((prev) => ({
        ...prev,
        [course.id]: course,
      }))
      const message = `课程《${course.title}》购买成功，凭证已写入链上。`
      setFeedback({ type: 'success', message })
      setToast({ type: 'success', message })
    } catch (error) {
      const message = error instanceof Error ? error.message : '购买失败，请稍后再试。'
      setFeedback({ type: 'error', message })
    } finally {
      setCurrentCourseId(null)
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-8 text-white shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">YD Course Platform</p>
            <h1 className="text-3xl font-semibold leading-snug">精选链上课程，实时更新</h1>
            <p className="text-sm text-white/80">
              最新创建的课程将优先展示。点击任意卡片即可直接完成授权与购买，交易记录可在个人中心随时查看。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orderedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPurchase={() => handlePurchase(course)}
              isPurchased={purchasedSet.has(course.id)}
              isPurchasing={wagmiPurchasing && currentCourseId === course.id}
            />
          ))}
          {isLoading && <p className="text-center text-xs text-slate-500">同步链上课程数据中...</p>}
        </div>
      </section>

      {toast && (
        <Toast {...toast} onClose={() => setToast(null)} />
      )}

      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-card md:flex-row md:items-center md:justify-between">
        <p>已购买课程可在个人中心查看详细学习凭证与内容链接。</p>
        <Link
          to="/profile"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white transition hover:bg-primary/80"
        >
          查看个人中心
        </Link>
      </section>

      <PurchaseFlow steps={purchaseSteps} />
    </div>
  )
}
