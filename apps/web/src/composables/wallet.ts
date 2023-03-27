import { ref } from 'vue'
import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useEthers from '@/composables/ethers'
import useWalletConnect from '@/composables/walletConnect'
import useSolana from '@/composables/solana'
import useUsers from '@/composables/users'
import { Account, ProviderString, User } from '@casimir/types'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import { Currency } from '@casimir/types'
import * as Session from 'supertokens-web-js/recipe/session'

// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test ethereum send to address : 0xd557a5745d4560B24D36A68b52351ffF9c86A212
// Test solana address: 7aVow9eVQjwn7Y4y7tAbPM1pfrE1TzjmJhxcRt8QwX5F
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme
// Test bitcoin send to address : 2N3Petr4LMH9tRneZCYME9mu33gR5hExvds

const loadingUserWallets = ref(false)

const loggedIn = ref(false)
const selectedProvider = ref<ProviderString>('')
const selectedAddress = ref<string>('')
const selectedCurrency = ref<Currency>('')
const primaryAddress = ref('')
const toAddress = ref<string>('2N3Petr4LMH9tRneZCYME9mu33gR5hExvds')
const amount = ref<string>('0.000001')
const amountToStake = ref<string>('0.0')
const session = ref<boolean>(false)

export default function useWallet() {
  const { ethereumURL } = useEnvironment()
  const { ethersProviderList, getEthersAddress, getEthersBalance, sendEthersTransaction, signEthersMessage, loginWithEthers, getEthersBrowserProviderSelectedCurrency, switchEthersNetwork } = useEthers()
  const { solanaProviderList, getSolanaAddress, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getBitcoinLedgerAddress, getEthersLedgerAddress, sendLedgerTransaction, signLedgerMessage } = useLedger()
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

  const setSelectedProvider = (provider: ProviderString) => {
    selectedProvider.value = provider
  }

  const setSelectedAddress = (address: string) => {
    selectedAddress.value = address
  }

  const setSelectedCurrency = (currency: Currency) => {
    selectedCurrency.value = currency
  }

  /**
   * Checks if session exists and, if so: 
   * Gets the user's account via the API
   * Sets the user's account locally
   */
  async function getUserAccount() {
    try {
      session.value = await Session.doesSessionExist()
      if (session.value) {
        const user = await getUser()
        setUser(user)
        return user
      }
    } catch (error) {
      console.log('Error in getUserAccount in wallet.ts :>> ', error)
      return null
    }
  }

  /**
   * Runs the login method for the selected provider
   * Checks if the user is logged in, if not, it will sign up or login
   * @param provider 
   * @param currency 
   * @returns 
   */
  async function connectWallet(provider: ProviderString, currency?: Currency) {
    try { // Sign Up or Login
      if (!loggedIn.value) {
        loadingUserWallets.value = true
        const connectedAddress = await getConnectedAddressFromProvider(provider, currency)
        const connectedCurrency = await detectCurrencyInProvider(provider) as Currency
        const loginResponse = await loginWithWallet(provider, connectedAddress, connectedCurrency)
        if (!loginResponse?.error) {
          // STEP 2
          const user = await getUserAccount() // Queries the API for the user's account
          setSelectedProvider(provider)
          setSelectedAddress(connectedAddress)
          setSelectedCurrency(connectedCurrency)
          loggedIn.value = true
          primaryAddress.value = user?.Address
        }
        loadingUserWallets.value = false
      } else { // Add account
        console.log('already logged in! attempting to add account')
        const connectedAddress = await getConnectedAddressFromProvider(provider, currency) // TODO: Remove currency from here? Maybe not.
        const connectedCurrency = await detectCurrencyInProvider(provider, currency) as Currency
        const accountExists = user.value?.Accounts?.some((account: Account) => account.address === connectedAddress && account.wallet_provider === provider)
        if (accountExists) {
          alert('Account already exists; setting provider, address, and currency')
          setSelectedProvider(provider)
          setSelectedAddress(connectedAddress)
          setSelectedCurrency(connectedCurrency)
          return user.value
        } else {
          // If no, add account using users api
          const response = await addAccount(provider, connectedAddress, connectedCurrency)
          // If api query is successful, set the user.value = to the response data (which should be the user)
          if (!response?.error) {
            setSelectedProvider(provider)
            setSelectedAddress(connectedAddress)
            setSelectedCurrency(connectedCurrency)
            primaryAddress.value = response.data?.address as string
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
      return address
    } catch (error) {
      console.error(error)
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
    } else {
      // TODO: Implement this for other providers
      console.log('Sign up not yet supported for this wallet provider')
    }
  }

  async function logout() {
    loadingUserWallets.value = true
    await Session.signOut()
    loggedIn.value = false
    setSelectedAddress('')
    setSelectedProvider('')
    setSelectedCurrency('')
    setUser()
    primaryAddress.value = ''
    console.log('user.value on logout :>> ', user.value)
    loadingUserWallets.value = false
  }

  async function setPrimaryWalletAccount() {
    if (!loggedIn.value) {
      alert('Please login first')
    }
    
    // TODO: Implement this for other providers
    if (ethersProviderList.includes(selectedProvider.value)) {
      const result = await updatePrimaryAddress(primaryAddress.value, selectedProvider.value, selectedAddress.value)
      const { data } = await result.json()
      if (data) {
        primaryAddress.value = data.address
      }
    }
  }

  async function removeConnectedAccount() {
    if (!loggedIn.value) {
      alert('Please login first')
    }
    if (selectedAddress.value === primaryAddress.value) {
      return alert('Cannot remove primary account')
    } else if (ethersProviderList.includes(selectedProvider.value)) {
      const result = await removeAccount(selectedProvider.value, selectedAddress.value, selectedCurrency.value)
      const json = await result.json()
      if (!json.error) {
        setSelectedAddress(json.data.address)
        json.data.accounts.forEach((account: Account) => {
          if (account.address === selectedAddress.value) {
            setSelectedProvider(account.walletProvider as ProviderString)
            setSelectedCurrency(account.currency as Currency)
          }
        })
      }
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

  async function getCurrentBalance() {
    // TODO: Implement this for other providers
    if (ethersProviderList.includes(selectedProvider.value)){
      const walletBalance = await getEthersBalance(selectedProvider.value, selectedAddress.value)
      console.log('walletBalance in wei in wallet.ts :>> ', walletBalance)
    return walletBalance
    } else {
      alert('Please select account')
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

  // This is the old method; currently used in users.ts so may want to still keep it
  async function getUserBalance(userAddress: string): Promise<ethers.BigNumber> {
    const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    const userBalance = await provider.getBalance(userAddress)
    console.log('userBalance :>> ', userBalance)
    return userBalance
  }

  return {
    loggedIn,
    selectedProvider,
    selectedAddress,
    selectedCurrency,
    primaryAddress,
    toAddress,
    amount,
    amountToStake,
    loadingUserWallets,
    connectWallet,
    logout,
    setPrimaryWalletAccount,
    removeConnectedAccount,
    detectCurrencyInProvider,
    getCurrentBalance,
    sendTransaction,
    signMessage,
    getUserBalance,
    switchNetwork
  }
}