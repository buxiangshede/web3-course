const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with account:', deployer.address)
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Balance:', ethers.formatEther(balance), 'ETH')

  const balanceRegistry = await ethers.deployContract('YDBalanceRegistry')
  await balanceRegistry.waitForDeployment()
  const balanceRegistryAddress = await balanceRegistry.getAddress()
  console.log('YDBalanceRegistry:', balanceRegistryAddress)

  const token = await ethers.deployContract('YDPlatformToken', [balanceRegistryAddress])
  await token.waitForDeployment()
  const tokenAddress = await token.getAddress()
  console.log('YDPlatformToken:', tokenAddress)

  const courseManager = await ethers.deployContract('CourseManager', [balanceRegistryAddress])
  await courseManager.waitForDeployment()
  const courseManagerAddress = await courseManager.getAddress()
  console.log('CourseManager:', courseManagerAddress)

  const stakingTreasury = await ethers.deployContract('StakingTreasury', [tokenAddress, balanceRegistryAddress])
  await stakingTreasury.waitForDeployment()
  const stakingAddress = await stakingTreasury.getAddress()
  console.log('StakingTreasury:', stakingAddress)

  const profileRegistry = await ethers.deployContract('ProfileRegistry', [balanceRegistryAddress])
  await profileRegistry.waitForDeployment()
  const profileRegistryAddress = await profileRegistry.getAddress()
  console.log('ProfileRegistry:', profileRegistryAddress)

  const operatorAddresses = [tokenAddress, courseManagerAddress, stakingAddress, profileRegistryAddress]
  for (const operator of operatorAddresses) {
    const tx = await balanceRegistry.setOperator(operator, true)
    await tx.wait()
    console.log('Enabled operator on registry:', operator)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
