import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/html'
import { configureChains, createConfig } from '@wagmi/core'
import { mainnet } from '@wagmi/core/chains'

const chains = [mainnet]
const projectId = '8e6877b49198d7a9f9561b8712805726'

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)

export default function useWalletConnectV2() {
  const web3modal = new Web3Modal({ projectId }, ethereumClient)
  
  return {  
    web3modal
  }
}