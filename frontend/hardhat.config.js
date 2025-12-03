require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

const {
  SEPOLIA_RPC_URL = '',
  SEPOLIA_PRIVATE_KEY = '',
  PRIVATE_KEY = '',
  ETHERSCAN_API_KEY = '',
} = process.env

const sanitize = (value = '') => {
  if (!value) return ''
  return value.includes('YOUR') ? '' : value
}

const rpcUrl = sanitize(SEPOLIA_RPC_URL)
const privateKey = sanitize(SEPOLIA_PRIVATE_KEY) || sanitize(PRIVATE_KEY)
const etherscanKey = sanitize(ETHERSCAN_API_KEY)

/** @type import('hardhat/config').HardhatUserConfig */
const networks = {
  hardhat: {},
  localhost: {
    url: 'http://127.0.0.1:8545',
  },
}

if (rpcUrl) {
  networks.sepolia = {
    url: rpcUrl,
    accounts: privateKey ? [privateKey] : undefined,
  }
}

const config = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks,
  etherscan: {
    apiKey: etherscanKey || undefined,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
}

module.exports = config
