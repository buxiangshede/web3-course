import { sepolia } from 'wagmi/chains'
import { env } from './env'

type ContractName =
  | 'YDPlatformToken'
  | 'YDBalanceRegistry'
  | 'CourseManager'
  | 'StakingTreasury'
  | 'ProfileRegistry'

export const CONTRACT_ADDRESSES: Record<number, Partial<Record<ContractName, string>>> = {
  // 本地 Hardhat 网络合约地址
  31337: {
    YDPlatformToken: '0x9E545E3C0baAB3E08CdfD552C960A1050f373042',
    YDBalanceRegistry: '0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB',
    CourseManager: '0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9',
    StakingTreasury: '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8',
    ProfileRegistry: '0x851356ae760d987E095750cCeb3bC6014560891C',
  },
  // Sepolia 测试网络
  [sepolia.id]: {
    YDPlatformToken: '0x3636C4790f5B1e7A44045AE33b8BbD4E06bcb1c8',
    YDBalanceRegistry: '0xA06eaF76EC588F785f67f7a3c71e8B54375869A3',
    CourseManager: '0x585508DdFa58aE8416F41C88C4FcCB0845317513',
    StakingTreasury: '0x06CaB4902c63a16A693ebba2c7677804D0937229',
    ProfileRegistry: '0x79d57B160c1b8bDe68554cB2017af9BD0FB6A31f',
  }

}
const ENV_ADDRESS_MAP: Record<ContractName, string> = {
  YDPlatformToken: env.ydTokenAddress,
  CourseManager: env.courseManagerAddress,
  StakingTreasury: env.stakingContractAddress,
  ProfileRegistry: env.profileRegistryAddress,
  YDBalanceRegistry: env.balanceRegistryAddress,
}

export function getContractAddress(name: ContractName, chainId?: number) {
  const id = chainId ?? 31337
  return (
    CONTRACT_ADDRESSES[id]?.[name] ||
    ENV_ADDRESS_MAP[name] ||
    CONTRACT_ADDRESSES[31337]?.[name] ||
    null
  )
}
