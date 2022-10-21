import { ethers } from 'ethers'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'

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

  async function getWalletConnectAddress() {
    const signer = await getEthersWalletConnectSigner()
    return await signer.getAddress()
  }

  async function signWalletConnectMessage(messageInit: MessageInit) {
    const signer = await getEthersWalletConnectSigner()
    return await signer.signMessage(messageInit.message)
  }

  async function sendWalletConnectTransaction(
    { from, to, value }: TransactionInit
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
    signWalletConnectMessage,
    sendWalletConnectTransaction
  }
}
