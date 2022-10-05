import { ref } from 'vue'
import { ethers } from 'ethers'
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
    providerString: ProviderString,
    { to, value }: { to: string; value: string }
  ) {
    const ethereum: any = window.ethereum
    const availableProviders = ref<BrowserProviders>(
      getBrowserProviders(ethereum)
    )
    const browserProvider =
      availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider =
      new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const signer = web3Provider.getSigner()
    const etherAmount = ethers.utils.parseEther(value)
    const tx = {
      to,
      value: etherAmount,
    }
    const { hash } = await signer.sendTransaction(tx)
    return hash
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