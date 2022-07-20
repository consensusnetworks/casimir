import { ref } from 'vue'
import { ethers } from 'ethers'
import { WalletProvider } from '@/interfaces/WalletProvider'

const defaultProviders = {
  metamask: undefined,
  coinbase: undefined,
}

export default function useWallet() {
  const ethereum: any = window.ethereum
  const availableProviders = ref<Record<string, WalletProvider>>(
    getAvailableProviders(ethereum)
  )
  const selectedProvider = ref<WalletProvider>({})
  const selectedAccount = ref<string>('')
  const toAddress = ref<string>('') // Test to address: 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
  const amount = ref<string>('')

  async function connectWallet(provider: string) {
    try {
      selectedProvider.value = availableProviders.value[provider]
      if (!selectedProvider.value) {
        throw new Error('No provider selected')
      }
      selectedAccount.value = await requestAccount(selectedProvider.value)
    } catch (error) {
      console.error(error)
    }
  }

  async function sendTransaction() {
    try {
      const web3Provider: ethers.providers.Web3Provider =
        new ethers.providers.Web3Provider(selectedProvider.value)
      const signer = web3Provider.getSigner()
      const etherAmount = ethers.utils.parseEther(amount.value)
      const tx = {
        to: toAddress.value,
        value: etherAmount,
      }
      signer.sendTransaction(tx).then((txObj) => {
        console.log('successful txHash: ', txObj.hash)
      })
    } catch (error) {
      console.error(error)
    }
  }

  return {
    selectedProvider,
    selectedAccount,
    toAddress,
    amount,
    connectWallet,
    sendTransaction,
  }
}

function getAvailableProviders(ethereum: any) {
  if (!ethereum) return defaultProviders
  else if (!ethereum.providerMap) {
    return {
      metamask: ethereum.isMetaMask ? ethereum : undefined,
      coinbase: ethereum.isCoinbaseWallet ? ethereum : undefined,
    }
  } else {
    return {
      metamask: ethereum.providerMap.get('MetaMask'),
      coinbase: ethereum.providerMap.get('CoinbaseWallet'),
    }
  }
}

async function requestAccount(provider: WalletProvider) {
  if (provider.request) {
    return await provider.request({
      method: 'eth_requestAccounts',
    })
  }
}
