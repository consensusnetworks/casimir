import { ref } from 'vue'
import { ethers } from 'ethers'
import useIopay from '@/composables/iopay'
import useEthers from '@/composables/ethers'

const { requestEthersAccount } = useEthers()
const { getIoPayAccounts, sendIoPayTransaction } = useIopay()

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
}

export default function useWallet() {
  const ethereum: any = window.ethereum
  const availableProviders = ref<any>(getAvailableProviders(ethereum)) // TODO: Retype this?
  const selectedProvider = ref<'MetaMask' | 'CoinbaseWallet' | 'IoPay' | ''>('')
  const selectedAccount = ref<string>('')
  const amount = ref<string>('')
  const toAddress = ref<string>('')
  // Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
  // Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

  async function connectWallet(provider: string) {
    try {
      if (provider === 'MetaMask') {
        selectedProvider.value = 'MetaMask'
        const browserExtensionProvider = availableProviders.value[provider]
        selectedAccount.value = (
          await requestEthersAccount(browserExtensionProvider)
        )[0]
      } else if (provider === 'CoinbaseWallet') {
        selectedProvider.value = 'CoinbaseWallet'
        const browserExtensionProvider = availableProviders.value[provider]
        selectedAccount.value = (
          await requestEthersAccount(browserExtensionProvider)
        )[0]
      } else if (provider === 'iopay') {
        const accounts = await getIoPayAccounts()
        const { address } = accounts[0]
        selectedProvider.value = 'IoPay'
        selectedAccount.value = address
      } else {
        throw new Error('No provider selected')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function sendTransaction() {
    try {
      if (
        selectedProvider.value === 'MetaMask' ||
        selectedProvider.value === 'CoinbaseWallet'
      ) {
        let browserExtensionProvider
        if (selectedProvider.value === 'MetaMask') {
          browserExtensionProvider = availableProviders.value['MetaMask']
        } else {
          browserExtensionProvider = availableProviders.value['coinbase']
        }
        const web3Provider: ethers.providers.Web3Provider =
          new ethers.providers.Web3Provider(browserExtensionProvider)
        const signer = web3Provider.getSigner()
        const etherAmount = ethers.utils.parseEther(amount.value)
        const tx = {
          to: toAddress.value,
          value: etherAmount,
        }
        signer.sendTransaction(tx).then((txObj) => {
          console.log('successful txHash: ', txObj.hash)
        })
      } else if (selectedProvider.value === 'IoPay') {
        // TODO: Per iopay.ts line 6, shouldn't I be able to invoke sendIoPayTransaction without arguments?
        await sendIoPayTransaction(toAddress.value, amount.value)
      } else {
        throw new Error('Provider selected not yet supported')
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
