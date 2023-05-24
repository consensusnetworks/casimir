import { ethers } from 'ethers'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { MessageRequest } from '@/interfaces/index'
import useAuth from '@/composables/auth'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import { CryptoAddress, LoginCredentials, TransactionRequest } from '@casimir/types'

const { createSiweMessage, signInWithEthereum } = useAuth()

/** WalletConnect signer promise needs to be resolved */
const isWalletConnectSigner = (signer: ethers.Signer | Promise<ethers.Signer> | undefined) => typeof (signer as Promise<ethers.Signer>).then === 'function'

export default function useWalletConnect() {
  const { ethereumURL, walletConnectURL } = useEnvironment()
  const { getGasPriceAndLimit } = useEthers()

  async function getEthersWalletConnectSigner(): Promise<ethers.Signer> {
    const options = {
      rpc: {
        1337: ethereumURL
      },
      bridge: walletConnectURL
    }
    const walletConnectProvider = new WalletConnectProvider(options)
    await walletConnectProvider.enable()
    const provider = new ethers.providers.Web3Provider(walletConnectProvider)
    return provider.getSigner()
  }

  async function getWalletConnectAddress(): Promise<CryptoAddress[]> {
    try {
      const signer = await getEthersWalletConnectSigner()
      const address = await signer.getAddress()
      const balance = await signer.getBalance()
      const ethBalance = ethers.utils.formatEther(balance)
      return [{ address, balance: ethBalance }] as CryptoAddress[]
    } catch (err) {
      console.log('error in getWalletConnectAddress :>> ', err)
      return []
    }
  }

  async function loginWithWalletConnect(loginCredentials: LoginCredentials) {
    const { provider, address, currency } = loginCredentials
    try {
      const message = await createSiweMessage(address, 'Sign in with Ethereum to the app.')
      const signedMessage = await signWalletConnectMessage({ message, providerString: provider })
      const walletConnectLoginResponse = await signInWithEthereum({
        address,
        currency: currency || 'ETH',
        provider,
        message,
        signedMessage
      })
      return await walletConnectLoginResponse.json()
    } catch (err) {
      console.log('error in loginWithWalletConnect :>> ', err)
    }
  }

  async function signWalletConnectMessage(messageRequest: MessageRequest) {
    const signer = await getEthersWalletConnectSigner()
    return await signer.signMessage(messageRequest.message)
  }

  async function sendWalletConnectTransaction(
    { from, to, value }: TransactionRequest
  ): Promise<ethers.providers.TransactionResponse> {
    const signer = await getEthersWalletConnectSigner()
    const provider = signer.provider as ethers.providers.Provider
    const { chainId } = await provider.getNetwork()
    const nonce = await provider.getTransactionCount(from)
    const unsignedTransaction = {
      from,
      to,
      nonce,
      chainId,
      value: ethers.utils.parseUnits(value)
    } as ethers.UnsignedTransaction
    const { gasPrice, gasLimit } = await getGasPriceAndLimit(ethereumURL, unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
    unsignedTransaction.gasPrice = gasPrice
    unsignedTransaction.gasLimit = gasLimit

    // Todo check before click (user can +/- gas limit accordingly)
    const balance = await provider.getBalance(from)
    const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
    console.log('Balance', ethers.utils.formatEther(balance))
    console.log('Required', ethers.utils.formatEther(required))

    return await signer.sendTransaction(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
  }

  return {
    isWalletConnectSigner,
    getEthersWalletConnectSigner,
    getWalletConnectAddress,
    loginWithWalletConnect,
    signWalletConnectMessage,
    sendWalletConnectTransaction
  }
}
