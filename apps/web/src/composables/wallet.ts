import { ref } from 'vue'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useEthers from '@/composables/ethers'
import useWalletConnect from '@/composables/walletConnect'
import useSolana from '@/composables/solana'
import useUsers from '@/composables/users'
import { Account, Currency, MessageInit, ProviderString, TransactionInit } from '@casimir/types'
import * as Session from 'supertokens-web-js/recipe/session'
import router from './router'

// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test ethereum send to address : 0xd557a5745d4560B24D36A68b52351ffF9c86A212
// Test solana address: 7aVow9eVQjwn7Y4y7tAbPM1pfrE1TzjmJhxcRt8QwX5F
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme
// Test bitcoin send to address : 2N3Petr4LMH9tRneZCYME9mu33gR5hExvds

const activeWallets = ref([
  'MetaMask',
  'CoinbaseWallet',
  'WalletConnect',
  'Trezor',
  'Ledger',
  'IoPay',
] as ProviderString[])
const amount = ref<string>('0.000001')
const amountToStake = ref<string>('0.0')
const loadingUserWallets = ref(false)
const primaryAddress = ref('')
const selectedProvider = ref<ProviderString>('')
const selectedAddress = ref<string>('')
const selectedCurrency = ref<Currency>('')
const toAddress = ref<string>('2N3Petr4LMH9tRneZCYME9mu33gR5hExvds')

export default function useWallet() {
  const { ethersProviderList, getEthersAddress, getEthersBalance, sendEthersTransaction, signEthersMessage, loginWithEthers, getEthersBrowserProviderSelectedCurrency, switchEthersNetwork } = useEthers()
  const { solanaProviderList, getSolanaAddress, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getBitcoinLedgerAddress, getEthersLedgerAddress, loginWithLedger, sendLedgerTransaction, signLedgerMessage } = useLedger()
  const { getTrezorAddress, sendTrezorTransaction, signTrezorMessage } = useTrezor()
  const { getWalletConnectAddress, sendWalletConnectTransaction, signWalletConnectMessage } = useWalletConnect()
  const { user, getUser, setUser, addAccount, removeAccount, updatePrimaryAddress } = useUsers()
  const getLedgerAddress = {
    'BTC': getBitcoinLedgerAddress,
    'ETH': getEthersLedgerAddress,
    'IOTX': () => {
      return new Promise((resolve, reject) => {
        console.log('IOTX is not yet supported on Ledger')
        resolve('IOTX is not yet supported on Ledger')
      }) as Promise<string>
    },
    'SOL': () => {
      return new Promise((resolve, reject) => {
        console.log('SOL is not yet supported on Ledger')
        resolve('SOL is not yet supported on Ledger')
      }) as Promise<string>
    },
    '': () => {
      return new Promise((resolve, reject) => {
        console.log('No currency selected')
        resolve('No currency selected')
      }) as Promise<string>
    },
    'USD': () => {
      return new Promise((resolve, reject) => {
        console.log('USD is not yet supported on Ledger')
        resolve('USD is not yet supported on Ledger')
      }) as Promise<string>
    }
  }

  /**
   * Runs the login method for the selected provider
   * Checks if the user is logged in, if not, it will sign up or login
   * @param provider 
   * @param currency 
   * @returns 
  */
  async function connectWallet(provider: ProviderString, currency: Currency = 'ETH') {
    try { // Sign Up or Login
      if (!user?.value?.address) {
        const connectedAddress = await getConnectedAddressFromProvider(provider, currency) as string
        const connectedCurrency = await detectCurrencyInProvider(provider) as Currency
        await loginWithWallet(provider, connectedAddress, connectedCurrency)
        const userResponse = await getUser()
        if (!userResponse?.error) {
          setUser(userResponse)
          setSelectedProvider(provider)
          setSelectedAddress(connectedAddress)
          setSelectedCurrency(connectedCurrency)
          primaryAddress.value = user?.value?.address as string
        }
        loadingUserWallets.value = false
        router.push('/')
      } else { // Add account
        console.log('already logged in')
        const connectedAddress = await getConnectedAddressFromProvider(provider, currency) as string
        const connectedCurrency = await detectCurrencyInProvider(provider, currency) as Currency
        const accountExists = user.value?.accounts?.some((account: Account | any) => { account?.address === connectedAddress && account?.walletProvider === provider })
        console.log('accountExists already exists on user :>> ', accountExists)
        if (accountExists) {
          alert('Account already exists; setting provider, address, and currency')
          setSelectedProvider(provider)
          setSelectedAddress(connectedAddress)
          setSelectedCurrency(connectedCurrency)
        } else {
          // If account doesn't exist, add account using users api
          console.log('adding sub account')
          const account = {
            address: connectedAddress.toLowerCase() as string,
            currency: connectedCurrency,
            ownerAddress: user?.value?.address.toLowerCase() as string,
            walletProvider: provider
          }
          const addAccountResponse = await addAccount(account)
          if (!addAccountResponse?.error) {
            const userResponse = await getUser()
            setUser(userResponse)
            setSelectedProvider(provider)
            setSelectedAddress(connectedAddress)
            setSelectedCurrency(connectedCurrency)
            primaryAddress.value = user?.value?.address as string
            router.push('/')
          }
        }
      }
      console.log('user.value after connecting wallet :>> ', user.value)
      return user.value
    } catch (error) {
      console.error('There was an error in connectWallet :>> ', error)
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

  /**
   * Retrieve the address from the selected provider
   * @param provider - MetaMask, CoinbaseWallet, Ledger, Trezor, WalletConnect, etc.
   * @param currency - ETH, BTC, IOTX, SOL, etc.
   * @returns 
   */
  async function getConnectedAddressFromProvider(provider: ProviderString, currency?: Currency) {
    try {
      let address
      setSelectedProvider(provider)
      if (provider === 'WalletConnect') {
        address = await getWalletConnectAddress()
      } else if (ethersProviderList.includes(provider)) {
        address = await getEthersAddress(provider)
      } else if (solanaProviderList.includes(provider)) {
        address = await getSolanaAddress(provider)
      } else if (provider === 'IoPay') {
        // address = await getIoPayAddress()
      } else if (provider === 'Ledger') {
        setSelectedCurrency(currency as Currency)
        address = await getLedgerAddress[currency as Currency]()
      } else if (provider === 'Trezor') {
        address = await getTrezorAddress()
      } else {
        throw new Error('No provider selected')
      }
      return trimAndLowercaseAddress(address) as string
    } catch (error) {
      console.error(error)
    }
  }

  // TODO: What is this used for? 
  // Do we need balance of active address only? 
  // Or do we need balance of all addresses in accounts associated with user? 
  // Is this calculated on front end or back end or both?
  async function getUserBalance() {
    if (ethersProviderList.includes(selectedProvider.value)){
      const walletBalance = await getEthersBalance(selectedProvider.value, selectedAddress.value)
      console.log('walletBalance in wei in wallet.ts :>> ', walletBalance)
    return walletBalance
    } else {
      alert('Please select account')
    }
  }

  /**
   * Uses appropriate provider composable to login or sign up
   * @param provider 
   * @param address 
   * @param currency 
   * @returns 
   */
  async function loginWithWallet(provider: ProviderString, address: string, currency: Currency) {
    if (ethersProviderList.includes(provider)) {
      return await loginWithEthers(provider, address, currency)
    } else if (provider === 'Ledger') {
      return await loginWithLedger(provider, address, currency)
    } else {
      // TODO: Implement this for other providers
      console.log('Sign up not yet supported for this wallet provider')
    }
  }

  async function logout() {
    loadingUserWallets.value = true
    await Session.signOut()
    user.value = undefined
    setSelectedAddress('')
    setSelectedProvider('')
    setSelectedCurrency('')
    setUser()
    primaryAddress.value = ''
    console.log('user.value on logout :>> ', user.value)
    loadingUserWallets.value = false
    router.push('/auth')
  }

  async function removeConnectedAccount() {
    if (!user?.value?.address) {
      alert('Please login first')
    }
    if (selectedAddress.value === primaryAddress.value) {
      return alert('Cannot remove primary account')
    } else if (ethersProviderList.includes(selectedProvider.value)) {
      const opts = {
        address: selectedAddress.value,
        currency: selectedCurrency.value,
        ownerAddress: primaryAddress.value,
        walletProvider: selectedProvider.value
      }
      const removeAccountResult = await removeAccount(opts)
      if (!removeAccountResult.error) {
        setSelectedAddress(removeAccountResult.data.address)
        removeAccountResult.data.accounts.forEach((account: Account) => {
          if (account.address === selectedAddress.value) {
            setSelectedProvider(account.walletProvider as ProviderString)
            setSelectedCurrency(account.currency as Currency)
          }
        })
      }
    }
  }

  async function sendTransaction() {
    const txInit: TransactionInit = {
      from: selectedAddress.value,
      to: toAddress.value,
      value: amount.value,
      providerString: selectedProvider.value,
      currency: selectedCurrency.value || ''
    }

    try {
      if (txInit.providerString === 'WalletConnect') {
        await sendWalletConnectTransaction(txInit)
      } else if (ethersProviderList.includes(txInit.providerString)) {
        await sendEthersTransaction(txInit)
      } else if (solanaProviderList.includes(txInit.providerString)) {
        await sendSolanaTransaction(txInit)
      } else if (selectedProvider.value === 'IoPay') {
        // await sendIoPayTransaction(txInit)
      } else if (selectedProvider.value === 'Ledger') {
        await sendLedgerTransaction(txInit)
      } else if (selectedProvider.value === 'Trezor') {
        await sendTrezorTransaction(txInit)
      } else {
        throw new Error('Provider selected not yet supported')
      }
    } catch (error) {
      console.error('sendTransaction error: ', error)
    }
  }

  // TODO: Implement this for other providers
  async function setPrimaryWalletAccount() {
    if (!user?.value?.address) {
      alert('Please login first')
    }
    return alert('Not yet implemented for this wallet provider')
    if (ethersProviderList.includes(selectedProvider.value)) {
      const result = await updatePrimaryAddress(primaryAddress.value, selectedProvider.value, selectedAddress.value)
      const { data } = await result.json()
      if (data) {
        primaryAddress.value = data.address
      }
    }
  }

  function setSelectedAddress (address: string) {
    selectedAddress.value = address
  }

  function setSelectedCurrency (currency: Currency) {
    selectedCurrency.value = currency
  }

  function setSelectedProvider (provider: ProviderString) {
    selectedProvider.value = provider
  }

  async function signMessage(message: string) {
    const messageInit: MessageInit = {
      message,
      providerString: selectedProvider.value,
      currency: selectedCurrency.value || ''
    }
    try {
      if (messageInit.providerString === 'WalletConnect') {
        await signWalletConnectMessage(messageInit)
      } else if (ethersProviderList.includes(messageInit.providerString)) {
        await signEthersMessage(messageInit)
      } else if (solanaProviderList.includes(messageInit.providerString)) {
        await signSolanaMessage(messageInit)
      } else if (messageInit.providerString === 'IoPay') {
        // await signIoPayMessage(messageInit)
      } else if (messageInit.providerString === 'Ledger') {
        await signLedgerMessage(messageInit)
      } else if (messageInit.providerString === 'Trezor') {
        await signTrezorMessage(messageInit)
      } else {
        console.log('signMessage not yet supported for this wallet provider')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function switchNetwork(chainId: string) {
    if (selectedProvider.value === 'MetaMask') {
      switchEthersNetwork('MetaMask', chainId)
    } else if (selectedProvider.value === 'CoinbaseWallet') {
      switchEthersNetwork('CoinbaseWallet', chainId)
    } else {
      alert('Switching networks is only supported for MetaMask and Coinbase Wallet')
    }
  }

  function trimAndLowercaseAddress(address: string) : string {
    return address.trim().toLowerCase()
  }

  return {
    activeWallets,
    amount,
    amountToStake,
    loadingUserWallets,
    primaryAddress,
    selectedAddress,
    selectedCurrency,
    selectedProvider,
    toAddress,
    connectWallet,
    detectCurrencyInProvider,
    logout,
    getUserBalance,
    removeConnectedAccount,
    sendTransaction,
    setPrimaryWalletAccount,
    signMessage,
    switchNetwork
  }
}