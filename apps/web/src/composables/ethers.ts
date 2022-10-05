import { ref } from 'vue'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@/types/ProviderString'

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
}

const ethereum: any = window.ethereum
const availableProviders = ref<BrowserProviders>(
  getBrowserProviders(ethereum)
)

export default function useEthers() {
  const ethersProviderList = ['MetaMask', 'CoinbaseWallet']
  async function requestEthersAccount(provider: ProviderString) {
    const browserExtensionProvider =
          availableProviders.value[provider as keyof BrowserProviders]
    if (browserExtensionProvider?.request) {
      return await browserExtensionProvider.request({
        method: 'eth_requestAccounts',
      })
    }
  }

  async function sendEthersTransaction(
    provider: EthersProvider,
    transaction: TransactionInit
  ) {
    return await provider.sendTransaction(transaction)
  }

  return { ethersProviderList, requestEthersAccount, getBrowserProviders, sendEthersTransaction }
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