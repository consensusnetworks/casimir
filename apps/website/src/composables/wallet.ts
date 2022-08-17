import { ref } from 'vue'
import { ethers } from 'ethers'
import useIoPay from '@/composables/iopay'
import useEthers from '@/composables/ethers'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@/types/ProviderString'
import {
  Connection,
  Transaction,
  SystemProgram,
  PublicKey,
} from '@solana/web3.js'

const amount = ref<string>('1')
const toAddress = ref<string>('')
const { requestEthersAccount } = useEthers()

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
  Phantom: undefined,
  Keplr: undefined,
}

const ethersProviderList = ['MetaMask', 'CoinbaseWallet']
const solanaProvidersList = ['Phantom']
const cosmosProvidersList = ['Keplr']
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test solana address: 7aVow9eVQjwn7Y4y7tAbPM1pfrE1TzjmJhxcRt8QwX5F
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

export default function useWallet() {
  const { getIoPayAccounts, sendIoPayTransaction } = useIoPay()
  const availableProviders = ref<BrowserProviders>(getBrowserProviders())
  const selectedProvider = ref<ProviderString>('')
  const selectedAccount = ref<string>('')
  const solanaPublicKey = ref({})
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
        const phantomProvider =
          availableProviders.value[provider as keyof BrowserProviders]
        const resp = await phantomProvider.connect()
        solanaPublicKey.value = resp.publicKey
        const address = resp.publicKey.toString()
        setSelectedAccount(address)
      } else if (provider === 'Keplr') {
        // TODO: Pick up from here (8/11)
        const chainIds = ['cosmoshub-4', 'theta-testnet-001']
        window.keplr.enable(chainIds)
        const chainId = 'cosmoshub-4' // 'theta-testnet-001'
        const keplrProvider =
          availableProviders.value[provider as keyof BrowserProviders]
        await keplrProvider.enable(chainId)
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
        const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(
          browserProvider as EthersProvider
        )
        const signer = web3Provider.getSigner()
        const etherAmount = ethers.utils.parseEther(amount.value)
        const tx = {
          to: toAddress.value,
          value: etherAmount,
        }
        signer.sendTransaction(tx).then((txObj) => {
          console.log('successful txHash: ', txObj.hash)
        })
      } else if (solanaProvidersList.includes(provider)) {
        const network = 'https://api.devnet.solana.com'
        const connection = new Connection(network)
        const { blockhash } = await connection.getLatestBlockhash('finalized')
        const to = new PublicKey(toAddress.value)
        const from = new PublicKey(selectedAccount.value)
        const lamports = Number(amount.value) * 1000000000
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: from,
            toPubkey: to,
            lamports,
          })
        )
        transaction.feePayer = from
        transaction.recentBlockhash = blockhash
        const { signature } = await availableProviders.value[
          'Phantom'
        ].signAndSendTransaction(transaction)
        await connection.getSignatureStatus(signature)
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
    ? window.phantom?.solana
    : undefined
  const keplr: any = window.keplr

  const providers = {
    MetaMask: undefined,
    CoinbaseWallet: undefined,
    Phantom: phantom,
    Keplr: keplr,
  }

  const ethereumProviders = checkForEthereumProviders()
  providers.MetaMask = ethereumProviders.MetaMask
  providers.CoinbaseWallet = ethereumProviders.CoinbaseWallet
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
