import { ref } from 'vue'
import { ethers } from 'ethers'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@/types/ProviderString'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'

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

  function getEthersProvider() {
    const rpcUrl = import.meta.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545/'
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    return provider
  }

  function getEthersSigner (providerString: ProviderString) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      const signer = new ethers.providers.Web3Provider(provider as EthersProvider).getSigner()
      return signer
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
      value: etherAmount,
    }
    const { hash } = await signer.sendTransaction(tx)
    return hash
  }

  async function signEthersMessage(messageInit: MessageInit): Promise<string> {
    const { providerString, hashedMessage } = messageInit
    const browserProvider =
      availableProviders.value[
      providerString as keyof BrowserProviders
      ]
    const web3Provider: ethers.providers.Web3Provider =
      new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const signer = web3Provider.getSigner()
    const signature = await signer.signMessage(hashedMessage)
    return signature
  }

  return { ethersProviderList, getEthersProvider, getEthersSigner, getEthersAddress, sendEthersTransaction, signEthersMessage }
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