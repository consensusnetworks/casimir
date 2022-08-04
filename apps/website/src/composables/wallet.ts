import { ref } from 'vue'
import { ethers } from 'ethers'
import useIoPay from '@/composables/iopay'
import useEthers from '@/composables/ethers'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@/types/ProviderString'

const amount = ref<string>('')
const toAddress = ref<string>('')
const { requestEthersAccount } = useEthers()

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
}

const ethersProviderList = ['MetaMask', 'CoinbaseWallet']
const solanaProvidersList = ['Phantom']
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

export default function useWallet() {
  const { getIoPayAccounts, sendIoPayTransaction } = useIoPay()
  const availableProviders = ref<BrowserProviders>(getBrowserProviders())
  const selectedProvider = ref<ProviderString>('')
  const selectedAccount = ref<string>('')
  const setSelectedProvider = (provider: ProviderString) => {
    selectedProvider.value = provider
  }
  const setSelectedAccount = (address: string) => {
    selectedAccount.value = address
  }

  async function connectWallet(provider: ProviderString) {
    try {
      setSelectedProvider(provider)
      selectedAccount.value = 'Not Active'
      if (ethersProviderList.includes(provider)) {
        const browserExtensionProvider =
          availableProviders.value[provider as keyof BrowserProviders]
        const accounts = await requestEthersAccount(
          browserExtensionProvider as EthersProvider
        )
        const address = accounts[0]
        setSelectedAccount(address)
      } else if (solanaProvidersList.includes(provider)) {
        try {
          const phantomProvider =
            availableProviders.value.Phantom[provider as keyof BrowserProviders]
          const resp = await provider.connect() // TODO: Pick up from here on 8/5
          console.log(resp.publicKey.toString())
          // 26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo
        } catch (err) {
          console.log(`Error connecting to ${provider}: ${err}`)
          // { code: 4001, message: 'User rejected the request.' }
        }
      } else if (provider === 'IoPay') {
        const accounts = await getIoPayAccounts()
        const { address } = accounts[0]
        setSelectedAccount(address)
      } else {
        throw new Error('No provider selected')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function sendTransaction(provider: string) {
    try {
      if (ethersProviderList.includes(provider)) {
        const browserProvider =
          availableProviders.value[provider as keyof BrowserProviders]
        const web3Provider: ethers.providers.Web3Provider =
          new ethers.providers.Web3Provider(browserProvider as EthersProvider)
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

function getBrowserProviders() {
  const ethereum: any = window.ethereum
  const phantom: any = window.phantom?.solana?.isPhantom
    ? window.phantom.solana
    : undefined

  const providers = {
    MetaMask: undefined,
    CoinbaseWallet: undefined,
    Phantom: undefined,
  }
  const ethereumProviders = checkForEthereumProviders()
  providers.MetaMask = ethereumProviders.MetaMask
  providers.CoinbaseWallet = ethereumProviders.CoinbaseWallet
  providers.Phantom = phantom

  return providers
}

function checkForEthereumProviders() {
  const ethereum = window.ethereum
  const providers = {
    MetaMask: undefined,
    CoinbaseWallet: undefined,
  }
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
  return providers
}
