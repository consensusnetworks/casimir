import { ethers } from 'ethers'
import { LoginCredentials } from '@casimir/types'
import useAuth from '@/composables/auth'
import useEnvironment from '@/composables/environment'
import { EthersWalletConnectSigner } from '@casimir/wallets'


const { createSiweMessage, signInWithEthereum } = useAuth()
const { ethereumUrl } = useEnvironment()

export default function useWalletConnectV2() {

  // TODO: Implement this in order to show ability to stake
  async function getEthersWalletConnectSignerV2() {
    const options = {
      provider: new ethers.providers.JsonRpcProvider(ethereumUrl),
      // rpcUrl: ethereumUrl
    }
    const signer = new EthersWalletConnectSigner(options)
    const initializedWallet = await signer.initializeWalletConnectClient()
    // const connect = await initializedWallet.connect({})
    // console.log('connect :>> ', connect)
    const mainnetCaip = 'eip155:1'
    const goerliCaip = 'eip155:5'
    const connectWalletResult = await signer.connectWallet(goerliCaip)
    return signer
  }

  // TODO: Check on signMessage
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
    getEthersWalletConnectSignerV2,
    loginWithWalletConnectV2
  }
}