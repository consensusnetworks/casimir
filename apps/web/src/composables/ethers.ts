import { ref } from 'vue'
import { ethers } from 'ethers'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@/types/ProviderString'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import useAuth from '@/composables/auth'

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
}

const ethereum: any = window.ethereum
const availableProviders = ref<BrowserProviders>(getBrowserProviders(ethereum))

export default function useEthers() {
  const ethersProviderList = ['MetaMask', 'CoinbaseWallet']

  async function requestEthersAccount(provider: EthersProvider) {
    if (provider?.request) {
      return await provider.request({
        method: 'eth_requestAccounts',
      })
    }
  }

  function getEthersBrowserSigner(providerString: ProviderString): ethers.Signer | undefined {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      return new ethers.providers.Web3Provider(provider as EthersProvider).getSigner()
    }
  }

  async function getEthersAddress (providerString: ProviderString) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      return (await requestEthersAccount(provider as EthersProvider))[0]
    }
  }

  async function sendEthersTransaction(
    { to, value, providerString }: TransactionInit
  ) {
    const browserProvider =
      availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider =
      new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const signer = web3Provider.getSigner()
    const etherAmount = ethers.utils.parseEther(value)
    const tx = {
      to,
      value: etherAmount
    }
    return await signer.sendTransaction(tx)
  }

  async function signEthersMessage(messageInit: MessageInit): Promise<string> {
    const { providerString, message } = messageInit
    const browserProvider =
      availableProviders.value[
      providerString as keyof BrowserProviders
      ]
    const web3Provider: ethers.providers.Web3Provider =
      new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const signer = web3Provider.getSigner()
    const signature = await signer.signMessage(message)

    // Todo move this sample code
    const { login } = useAuth()
    const response = await login({ address: signer._address, message: message.toString(), signedMessage: signature })
    console.log('Response', await response.json()) // Currently the response is always false
    return signature
  }

  async function getGasPriceAndLimit(
    rpcUrl: string,
    unsignedTransaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>
  ) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const gasPrice = await provider.getGasPrice()
    const gasLimit = await provider.estimateGas(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
    return { gasPrice, gasLimit }
  }

  return { ethersProviderList, getEthersBrowserSigner, getEthersAddress, sendEthersTransaction, signEthersMessage, getGasPriceAndLimit }
}

function getBrowserProviders(ethereum: any) {
  if (!ethereum) return defaultProviders
  else if (!ethereum.providerMap) {
    return {
      MetaMask: ethereum.isMetaMask ? ethereum : undefined,
      CoinbaseWallet: ethereum.isCoinbaseWallet ? ethereum : undefined,
    }
  } else {
    return {
      MetaMask: ethereum.providerMap.get('MetaMask'),
      CoinbaseWallet: ethereum.providerMap.get('CoinbaseWallet'),
    }
  }
}