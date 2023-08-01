import { ethers } from 'ethers'
import { EthersWalletConnectSigner } from '@casimir/wallets'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/html'
import { configureChains, createConfig, mainnet, signMessage } from '@wagmi/core'
import { publicProvider } from '@wagmi/core/providers/public'
import { CryptoAddress, LoginCredentials } from '@casimir/types'
import { infuraProvider } from '@wagmi/core/providers/infura'
import useAuth from '@/composables/auth'
import useEthers from '@/composables/ethers'
import useEnvironment from '@/composables/environment'


const { getEthersBalance } = useEthers()
const { createSiweMessage, signInWithEthereum } = useAuth()
const { ethereumUrl } = useEnvironment()

// const chains = [mainnet]
const projectId = '8e6877b49198d7a9f9561b8712805726'



const { chains, publicClient } = configureChains(
  [mainnet],
  [w3mProvider({ projectId }), publicProvider()]
)
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})

export default function useWalletConnectV2() {
  const ethereumClient = new EthereumClient(wagmiConfig, chains)
  const web3modal = new Web3Modal({ projectId }, ethereumClient)

  async function getEthersWalletConnectSignerV2() {
    // const options = {
    //   provider: new ethers.providers.JsonRpcProvider(ethereumUrl),
    //   // baseURL: speculosUrl
    // }
    // return new EthersWalletConnectSigner(options)
    const signer = EthersWalletConnectSigner.create({})
    // const signer = await EthersWalletConnectSigner.create({ provider: new ethers.providers.JsonRpcProvider(ethereumUrl) })
    console.log('signer :>> ', signer)
    return signer
  }

  async function getWalletConnectAddressAndBalance() : Promise<CryptoAddress> {
    const { address } = (ethereumClient.getAccount())
    const balance = (await getEthersBalance(address as string)).toString()
    return {
      address: address?.toLowerCase() as string,
      balance: balance as string
    }
  }

  async function loginWithWalletConnectV2(loginCredentials: LoginCredentials) {
    const { provider, address, currency } = loginCredentials
    try {
      const message = await createSiweMessage(address, 'Sign in with Ethereum to the app.')
      const signedMessage = await signMessage({message})
      await signInWithEthereum({
        address,
        currency: currency || 'ETH',
        provider,
        message,
        signedMessage
      })
    } catch (err) {
      console.log('error in loginWithWalletConnect :>> ', err)
    }
  }
  
  return {  
    web3modal,
    getWalletConnectAddressAndBalance,
    getEthersWalletConnectSignerV2,
    loginWithWalletConnectV2
  }
}