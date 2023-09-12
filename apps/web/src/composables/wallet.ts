import { ref } from 'vue'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
// import useSolana from '@/composables/solana'
import useTrezor from '@/composables/trezor'
import { CryptoAddress, Currency, MessageRequest, ProviderString, TransactionRequest } from '@casimir/types'

// Test ethereum send from address : 0xd557a5745d4560B24D36A68b52351ffF9c86A212
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test solana address: 7aVow9eVQjwn7Y4y7tAbPM1pfrE1TzjmJhxcRt8QwX5F
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme
// Test bitcoin send to address : 2N3Petr4LMH9tRneZCYME9mu33gR5hExvds


const amount = ref<string>('1')
const amountToStake = ref<string>('1.2')
const walletProviderAddresses = ref<CryptoAddress[]>([])
const loadingUserWallets = ref(false)
const primaryAddress = ref('')
const selectedProvider = ref<ProviderString>('')
const selectedAddress = ref<string>('')
const selectedCurrency = ref<Currency>('')
const toAddress = ref<string>('0x728474D29c2F81eb17a669a7582A2C17f1042b57')

export default function useWallet() {
  const { ethersProviderList, sendEthersTransaction, signEthersMessage, getEthersBrowserProviderSelectedCurrency, switchEthersNetwork } = useEthers()
  const { getLedgerAddress, sendLedgerTransaction, signLedgerMessage } = useLedger()
  // const { solanaProviderList, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getTrezorAddress, sendTrezorTransaction, signTrezorMessage } = useTrezor()

  function getColdStorageAddress(provider: ProviderString, currency: Currency = 'ETH') {
    if (provider === 'Ledger') {
      new Promise((resolve, reject) => {
        resolve(getLedgerAddress[currency]())
      })
    } else if (provider === 'Trezor') {
      new Promise((resolve, reject) => {
        resolve(getTrezorAddress[currency]())
      })
    } else {
      return new Promise((resolve, reject) => {
        resolve('Cold storage provider not yet supported')
      })
    }
  }

  /**
   * Detects the currency of the connected wallet provider and account
   * @param provider 
   * @param currency 
   * @returns 
   */
  async function detectCurrencyInProvider(provider: ProviderString, currency?: Currency) {
    // TODO: Implement this for other providers
    if (ethersProviderList.includes(provider)){
      return await getEthersBrowserProviderSelectedCurrency(provider) as Currency
    } else if (provider === 'Ledger') {
      return currency as Currency
    } else {
      alert('Currency selection not yet supported for this wallet provider')
    }
  }

  async function switchNetwork(chainId: string): Promise<void> {
    try {
      if (selectedProvider.value === 'MetaMask') {
        switchEthersNetwork('MetaMask', chainId)
      } else if (selectedProvider.value === 'CoinbaseWallet') {
        switchEthersNetwork('CoinbaseWallet', chainId)
      } else {
        alert('Switching networks is only supported for MetaMask and Coinbase Wallet')
      }
    } catch (error) {
      console.error(error)
      return new Promise((resolve, reject) => reject(error))
    }
  }

  return {
    amount,
    amountToStake,
    detectCurrencyInProvider,
    loadingUserWallets,
    primaryAddress,
    selectedAddress,
    selectedCurrency,
    selectedProvider,
    switchNetwork,
    toAddress,
    walletProviderAddresses
  }
}