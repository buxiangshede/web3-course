import { useMemo } from 'react'
import { useAccount, useChainId, useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'

import { getContractAddress } from '../config/contracts'
import { courseManagerAbi } from '../lib/abi'
import { Course } from '../types/course'
import { mockCourses } from '../data/mockCourses'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const parseCourse = (raw: any): Course | null => {
  if (!raw) return null
  const [id, creator, name, description, priceWei, category, contentUri] = raw as [
    bigint,
    string,
    string,
    string,
    bigint,
    string,
    string,
  ]
  if (creator === ZERO_ADDRESS) return null
  return {
    id: id.toString(),
    title: name,
    description,
    priceYD: Number(formatEther(priceWei)),
    cover: mockCourses[Number(id) % mockCourses.length]?.cover ?? mockCourses[0].cover,
    rating: 4.8,
    learners: 0,
    category: (category || '进阶') as Course['category'],
    tags: ['On-chain', 'Live'],
    contentUrl: contentUri,
  }
}

export const useCourseManager = () => {
  const { address: wallet } = useAccount()
  const chainId = useChainId()
  const contractAddress = (getContractAddress('CourseManager', chainId) ??
    ZERO_ADDRESS) as `0x${string}`
  const enabled = contractAddress !== ZERO_ADDRESS

  const { data: nextCourseId } = useReadContract({
    address: enabled ? contractAddress : undefined,
    abi: courseManagerAbi,
    functionName: 'nextCourseId',
    query: {
      enabled,
    },
  })

  const courseIds = useMemo(() => {
    if (!nextCourseId) return []
    const limit = Number(nextCourseId) - 1
    return limit > 0 ? Array.from({ length: limit }, (_, idx) => BigInt(idx + 1)) : []
  }, [nextCourseId])

  const { data: coursesData } = useReadContracts({
    contracts: courseIds.map((id) => ({
      address: contractAddress,
      abi: courseManagerAbi,
      functionName: 'courses',
      args: [id],
    })),
    query: {
      enabled: enabled && courseIds.length > 0,
    },
  })

  const courses = useMemo(() => {
    if (!coursesData || coursesData.length === 0) return []
    return coursesData
      .map((item) => (item.status === 'success' ? parseCourse(item.result) : null))
      .filter((course): course is Course => Boolean(course))
  }, [coursesData])

  const { data: purchasedFlags } = useReadContracts({
    contracts:
      wallet && courseIds.length > 0
        ? courseIds.map((id) => ({
            address: contractAddress,
            abi: courseManagerAbi,
            functionName: 'hasPurchased',
            args: [wallet as `0x${string}`, id],
          }))
        : [],
    query: {
      enabled: Boolean(wallet) && enabled && courseIds.length > 0,
    },
  })

  const purchasedCourses = useMemo(() => {
    if (!wallet || !purchasedFlags || courses.length === 0) return []
    return courses.filter((_, index) => Boolean(purchasedFlags[index]?.result))
  }, [purchasedFlags, courses, wallet])

  return {
    courses: courses.length > 0 ? courses : mockCourses,
    purchasedCourses,
    isLoading: enabled && courseIds.length > 0 && !coursesData,
  }
}
