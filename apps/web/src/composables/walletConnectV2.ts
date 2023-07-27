import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/html'
import { configureChains, createConfig } from '@wagmi/core'
import { mainnet } from '@wagmi/core/chains'
import useEthers from '@/composables/ethers'
import useAuth from '@/composables/auth'
import { CryptoAddress, LoginCredentials, MessageRequest } from '@casimir/types'

const { getEthersBalance } = useEthers()
const { createSiweMessage, signInWithEthereum } = useAuth()

const chains = [mainnet]
const projectId = '8e6877b49198d7a9f9561b8712805726'

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})

export default function useWalletConnectV2() {
  const ethereumClient = new EthereumClient(wagmiConfig, chains)
  const web3modal = new Web3Modal({ projectId }, ethereumClient)

  async function getWalletConnectAddressAndBalance() : Promise<CryptoAddress> {
    const { address } = (ethereumClient.getAccount())
    const balance = (await getEthersBalance(address as string)).toString()
    return {
      address: address?.toLowerCase() as string,
      balance: balance as string
    }
  }

  // async function loginWithWalletConnectV2(loginCredentials: LoginCredentials) {
  //   const { provider, address, currency } = loginCredentials
  //   try {
  //     const message = await createSiweMessage(address, 'Sign in with Ethereum to the app.')
  //     const signedMessage = await signWalletConnectMessage({ message, providerString: provider })
  //     await signInWithEthereum({
  //       address,
  //       currency: currency || 'ETH',
  //       provider,
  //       message,
  //       signedMessage
  //     })
  //   } catch (err) {
  //     console.log('error in loginWithWalletConnect :>> ', err)
  //   }
  // }

  async function signWalletConnectMessage(messageRequest: MessageRequest) {
    console.log('got to signWalletConnectMessage')
    const connectors = ethereumClient.getConnectors()
    console.log('connectors :>> ', connectors)
    // const signer = await ethereumClient.getSigner(messageRequest.providerString)
    // return await signer.signMessage(messageRequest.message)
  }
  
  return {  
    web3modal,
    getWalletConnectAddressAndBalance,
    // loginWithWalletConnectV2
  }
}