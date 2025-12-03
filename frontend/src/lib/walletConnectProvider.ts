import EthereumProvider from '@walletconnect/ethereum-provider'
import { env } from '../config/env'

let providerPromise: Promise<EthereumProvider> | null = null

export const getWalletConnectProvider = () => {
  if (!providerPromise) {
    providerPromise = EthereumProvider.init({
      projectId: env.walletConnectProjectId,
      optionalChains: [31337, 137, 42161, 10, 8453],
      showQrModal: true,
    })
  }

  return providerPromise
}
