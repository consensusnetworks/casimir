import { ref } from 'vue'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useSolana from '@/composables/solana'
import useTrezor from '@/composables/trezor'
import useTrustWallet from '@/composables/trustWallet'
import useUsers from '@/composables/users'
import useWalletConnect from '@/composables/walletConnect'
import { Account, CryptoAddress, Currency, ProviderString, LoginCredentials} from '@casimir/types'
import { MessageInit, TransactionInit } from '@/interfaces/index'
import * as Session from 'supertokens-web-js/recipe/session'
import router from './router'

// Test ethereum send from address : 0xd557a5745d4560B24D36A68b52351ffF9c86A212
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
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
const amount = ref<string>('1')
const amountToStake = ref<string>('0.0')
const userAddresses = ref<CryptoAddress[]>([])
const loadingUserWallets = ref(false)
const primaryAddress = ref('')
const selectedProvider = ref<ProviderString>('')
const selectedAddress = ref<string>('')
const selectedPathIndex = ref<string>('')
const selectedCurrency = ref<Currency>('')
const toAddress = ref<string>('0x728474D29c2F81eb17a669a7582A2C17f1042b57')

export default function useWallet() {
  const { estimateEIP1559GasFee, ethersProviderList, getEthersAddress, getEthersAddressWithBalance, getEthersBalance, sendEthersTransaction, signEthersMessage, loginWithEthers, getEthersBrowserProviderSelectedCurrency, switchEthersNetwork } = useEthers()
  const { getLedgerAddress, loginWithLedger, sendLedgerTransaction, signLedgerMessage } = useLedger()
  const { solanaProviderList, getSolanaAddress, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getTrezorAddress, loginWithTrezor, sendTrezorTransaction, signTrezorMessage } = useTrezor()
  const { getTrustWalletAddressWithBalance, loginWithTrustWallet } = useTrustWallet()
  const { user, getUser, setUser, addAccount, checkIfSecondaryAddress, checkIfPrimaryByAddress, removeAccount, updatePrimaryAddress } = useUsers()
  const { getWalletConnectAddress, loginWithWalletConnect, sendWalletConnectTransaction, signWalletConnectMessage } = useWalletConnect()

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
   * Runs the login method for the selected provider
   * Checks if the user is logged in, if not, it will sign up or login
   * @param provider 
   * @param currency 
   * @returns 
  */
  async function connectWallet() {
    try { // Sign Up or Login
      if (!user?.value?.address) {
        await login()
        const userResponse = await getUser()
        if (!userResponse?.error) {
          setUser(userResponse)
          setPrimaryAddress(user?.value?.address as string)
        }
        loadingUserWallets.value = false
        // router.push('/')
      } else { // Add account if it doesn't already exist
        const userAccountExists = user.value?.accounts?.some((account: Account | any) => account?.address === selectedAddress.value && account?.walletProvider === selectedProvider.value && account?.currency === selectedCurrency.value)
        if (userAccountExists) {
          alert('A user account already exists; setting provider, address, and currency')
        } else {
          console.log('adding sub account')
          const account = {
            userId: user?.value?.id,
            address: selectedAddress.value.toLowerCase() as string,
            currency: selectedCurrency.value || 'ETH',
            ownerAddress: user?.value?.address.toLowerCase() as string,
            walletProvider: selectedProvider.value
          }
          const addAccountResponse = await addAccount(account)
          if (!addAccountResponse?.error) {
            const userResponse = await getUser()
            setUser(userResponse)
            setPrimaryAddress(user?.value?.address as string)
            // router.push('/')
          }
        }
      }
      await setUserAccountBalances()
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

  async function getAccountBalance(account: Account) {
    // TODO: Find where api endpoint is configured for ethers.
    try {
      const balance = await getEthersBalance(account.address)
      return balance
    } catch (err) {
      console.error('There was an error in getAccountBalance :>> ', err)
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
        // Ask user to select an account
        address = await getColdStorageAddress(provider, currency as Currency)
      } else if (provider === 'Trezor') {
        address = await getColdStorageAddress(provider, currency as Currency)
      } else {
        throw new Error('No provider selected')
      }
      return trimAndLowercaseAddress(address) as string
    } catch (error) {
      console.error(error)
    }
  }

  // Do we need balance of active address only? 
  // Or do we need balance of all addresses in accounts associated with user? 
  // Is this calculated on front end or back end or both?
  async function getUserBalance() {
    if (ethersProviderList.includes(selectedProvider.value)){
      const walletBalance = await getEthersBalance(selectedAddress.value)
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
  async function login() {
    const loginCredentials = {
      provider: selectedProvider.value,
      address: selectedAddress.value,
      currency: selectedCurrency.value || 'ETH'
    } as LoginCredentials
    if (ethersProviderList.includes(selectedProvider.value)) {
      return await loginWithEthers(loginCredentials)
    } else if (selectedProvider.value === 'Ledger') {
      return await loginWithLedger(loginCredentials, selectedPathIndex.value)
    } else if (selectedProvider.value === 'Trezor') {
      return await loginWithTrezor(loginCredentials, selectedPathIndex.value)
    } else if (selectedProvider.value === 'TrustWallet') {
      return await loginWithTrustWallet(loginCredentials)
    } else if (selectedProvider.value === 'WalletConnect'){
      return await loginWithWalletConnect(loginCredentials)
    } else {
      // TODO: Implement this for other providers
      console.log('Sign up not yet supported for this wallet provider')
    }
  }

  async function logout() {
    loadingUserWallets.value = true
    await Session.signOut()
    setSelectedAddress('')
    setSelectedProvider('')
    setSelectedCurrency('')
    setUser(undefined)
    setPrimaryAddress('')
    loadingUserWallets.value = false
    // router.push('/auth')
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

  /**
   * Sets the selected address and returns the address
   * @param provider 
   * @param currency 
   */
  async function selectAddress(address: any, pathIndex?: string) : Promise<void | Account[]> {
    address = trimAndLowercaseAddress(address)
    setSelectedAddress(address)
    
    if (pathIndex) setSelectedPathIndex(pathIndex)
    
    const isPrimaryAddress : boolean = await checkIfPrimaryByAddress(selectedAddress.value)
    if (isPrimaryAddress) {
      return await connectWallet() // login
    }
    
    const accountsIfSecondaryAddress : Account[] | void = await checkIfSecondaryAddress(selectedAddress.value)
    if (accountsIfSecondaryAddress.length) {
      return accountsIfSecondaryAddress
    } else {
      return await connectWallet() // sign up
    }
  }

  // TODO: Check if we can find a way to scroll through addresses on MetaMask and CoinbaseWallet
  /**
   * Sets the selected provider and returns the set of addresses available for the selected provider
   * @param provider 
   * @param currency 
   */
  async function selectProvider(provider: ProviderString, currency: Currency = 'ETH') {
    console.clear()
    try {
      if (provider === 'WalletConnect') {
        setSelectedProvider(provider)
        const walletConnectAddresses = await getWalletConnectAddress()
        setUserAddresses(walletConnectAddresses)
      } else if (ethersProviderList.includes(provider)) {
        setSelectedProvider(provider)
        const ethersAddresses = await getEthersAddressWithBalance(provider) as CryptoAddress[]
        setUserAddresses(ethersAddresses)
      } else if (provider === 'Ledger') {
        setSelectedProvider(provider)
        const ledgerAddresses = await getLedgerAddress[currency]() as CryptoAddress[]
        setUserAddresses(ledgerAddresses)
      } else if (provider === 'Trezor') {
        setSelectedProvider(provider)
        const trezorAddresses = await getTrezorAddress[currency]() as CryptoAddress[]
        setUserAddresses(trezorAddresses)
      } else if (provider === 'TrustWallet') {
        setSelectedProvider(provider)
        const trustWalletAddresses = await getTrustWalletAddressWithBalance() as CryptoAddress[]
        setUserAddresses(trustWalletAddresses)
      }
    } catch (error) {
      console.error('There was an error in selectProvider :>> ', error)
      if (error.name === 'TransportStatusError') alert('Please enter your PIN and open the Ethereum application on your device.')
    }
  }

  // TODO: Implement this for other providers
  async function setPrimaryWalletAccount() {
    if (!user?.value?.address) {
      alert('Please login first')
    } else if (ethersProviderList.includes(selectedProvider.value)) {
      const result = await updatePrimaryAddress(selectedAddress.value)
      const { data } = await result.json()
      if (data) {
        setPrimaryAddress(data.address)
      }
    } else {
      return alert('Not yet implemented for this wallet provider')
    }
  }

  function setPrimaryAddress(address: string) {
    primaryAddress.value = address
  }

  function setSelectedAddress (address: string) {
    selectedAddress.value = address
  }

  function setSelectedCurrency (currency: Currency) {
    selectedCurrency.value = currency
  }

  function setSelectedPathIndex (pathIndex: string) {
    selectedPathIndex.value = pathIndex
  }

  function setSelectedProvider (provider: ProviderString) {
    selectedProvider.value = provider
  }

  async function setUserAccountBalances() {
    if (user?.value?.accounts) {
      const accounts = user.value.accounts
      const accountsWithBalances = await Promise.all(accounts.map(async (account: Account) => {
        const balance = await getAccountBalance(account)
        return {
          ...account,
          balance
        }
      }))
      user.value.accounts = accountsWithBalances
      setUser(user.value)
    }
  }

  function setUserAddresses(addresses: CryptoAddress[]) {
    userAddresses.value = addresses
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
    connectWallet,
    detectCurrencyInProvider,
    getUserBalance,
    loadingUserWallets,
    logout,
    primaryAddress,
    removeConnectedAccount,
    selectAddress,
    selectProvider,
    selectedAddress,
    selectedCurrency,
    selectedProvider,
    sendTransaction,
    setPrimaryWalletAccount,
    setUserAccountBalances,
    signMessage,
    switchNetwork,
    toAddress,
    userAddresses
  }
}