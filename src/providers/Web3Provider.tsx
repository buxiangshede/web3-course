import { PropsWithChildren, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { hardhat, mainnet, sepolia } from 'wagmi/chains'

const chains = [mainnet, hardhat, sepolia] as const
const queryClient = new QueryClient()

console.log()



export const Web3Provider = ({ children }: PropsWithChildren) => {
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        connectors: [
          injected({
            target: 'metaMask',
            shimDisconnect: true,
          }),
          metaMask()
        ],
        ssr: false,
        chains,
        transports: {
          [hardhat.id]: http('http://127.0.0.1:8545'),
          [sepolia.id]: http("https://sepolia.infura.io/v3/840279fbde5e42c4abb33f5914fac1ae"),
          [mainnet.id]: http(),
        },
      }),
    [],
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
