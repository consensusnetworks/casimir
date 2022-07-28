import { ref } from 'vue'
import { ethers } from 'ethers'
import { WalletProvider } from '@/interfaces/WalletProvider'
import useIopay from '@/composables/iopay'

const { getIoPayAccounts, getIoPayProvider, sendIoPayTransaction } = useIopay()

const defaultProviders = {
  metamask: undefined,
  coinbase: undefined,
  iopay: undefined,
}

export default function useWallet() {
  const ethereum: any = window.ethereum
  const availableProviders = ref<Record<string, WalletProvider>>(
    getAvailableProviders(ethereum)
  )
  const selectedProvider = ref<WalletProvider | string>({}) // Adding string type to support 'iopay' throws new ts errors in sendTransaction
  const selectedAccount = ref<string>('')
  const amount = ref<string>('') // Use '1' to test
  const toAddress = ref<string>('')
  // Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
  // Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

  async function connectWallet(provider: string) {
    try {
      if (provider === 'iopay') {
        const accounts = await getIoPayAccounts()
        const { address } = accounts[0]
        selectedProvider.value = getIoPayProvider()
        selectedAccount.value = address
      } else {
        selectedProvider.value = availableProviders.value[provider]
        if (!selectedProvider.value) {
          throw new Error('No provider selected')
        }
        selectedAccount.value = await requestAccount(selectedProvider.value)
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function sendTransaction() {
    try {
      if (
        // TODO: Understand and fix typescript error on next 5 lines
        selectedProvider.value?.isMetaMask ||
        selectedProvider.value?.isCoinbaseWallet
      ) {
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
      } else {
        // TODO: Add more verbose logic to handle non-browser providers (e.g. iopay, ledger, etc)
        await sendIoPayTransaction()
      }
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
