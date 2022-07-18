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
  const toAddress = ref<string>('') // Test to address: 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
  const amount = ref<string>('')

  const metamaskAccountsResult = ref<string>('Address Not Active')
  const coinbaseAccountsResult = ref<string>('Address Not Active')
  const metamaskButtonText = ref<string>('Connect Metamask')
  const coinbaseButtonText = ref<string>('Connect Coinbase')

  async function connectWallet(provider: string) {
    try {
      selectedProvider.value = availableProviders.value[provider]
      if (!selectedProvider.value) {
        throw new Error('No provider selected')
      }
      const account = await requestAccount(selectedProvider.value)

      if (provider === 'metamask') {
        metamaskButtonText.value = 'Metamask Connected'
        metamaskAccountsResult.value = account[0]
        coinbaseAccountsResult.value = 'Not Active'
        coinbaseButtonText.value = 'Connect Coinbase'
        metamaskButtonText.value = 'Metamask Connected'
      } else if (provider === 'coinbase') {
        coinbaseAccountsResult.value = ''
        coinbaseAccountsResult.value = account[0]
        metamaskAccountsResult.value = 'Not Active'
        coinbaseButtonText.value = 'Coinbase Connected'
        metamaskButtonText.value = 'Connect Metamask'
      }
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
    toAddress,
    amount,
    connectWallet,
    sendTransaction,
    metamaskButtonText,
    metamaskAccountsResult,
    coinbaseButtonText,
    coinbaseAccountsResult,
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
