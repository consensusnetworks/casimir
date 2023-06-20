import { ref } from 'vue'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useSolana from '@/composables/solana'
import useTrezor from '@/composables/trezor'
import useUsers from '@/composables/users'
import useWalletConnect from '@/composables/walletConnect'
import { Account, CryptoAddress, Currency, ExistingUserCheck, LoginCredentials, MessageRequest, ProviderString, TransactionRequest, ErrorSuccessInterface } from '@casimir/types'
import * as Session from 'supertokens-web-js/recipe/session'

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
const amountToStake = ref<string>('1.2')
const userAddresses = ref<CryptoAddress[]>([])
const loadingUserWallets = ref(false)
const primaryAddress = ref('')
const selectedProvider = ref<ProviderString>('')
const selectedAddress = ref<string>('')
const selectedPathIndex = ref<string>('')
const selectedCurrency = ref<Currency>('')
const toAddress = ref<string>('0x728474D29c2F81eb17a669a7582A2C17f1042b57')

export default function useWallet() {
  const { estimateEIP1559GasFee, ethersProviderList, getEthersAddressWithBalance, getEthersBalance, sendEthersTransaction, signEthersMessage, loginWithEthers, getEthersBrowserProviderSelectedCurrency, switchEthersNetwork } = useEthers()
  const { getLedgerAddress, loginWithLedger, sendLedgerTransaction, signLedgerMessage } = useLedger()
  const { solanaProviderList, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getTrezorAddress, loginWithTrezor, sendTrezorTransaction, signTrezorMessage } = useTrezor()
  const { user, getUser, setUser, addAccount, checkIfSecondaryAddress, checkIfPrimaryUserExists, removeAccount, updatePrimaryAddress } = useUsers()
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
  async function connectWallet(): Promise<ErrorSuccessInterface> {
    try { // Sign Up or Login
      if (!user?.value?.address) {
        await login()
        const getUserResponse = await getUser()
        if (!getUserResponse?.error) {
          setUser(getUserResponse.data)
          setPrimaryAddress(user?.value?.address as string)
        }
        loadingUserWallets.value = false
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
            const getUserResponse = await getUser()
            setUser(getUserResponse.data)
            setPrimaryAddress(user?.value?.address as string)
          } else {
            console.error('There was an error adding the account :>> ', addAccountResponse.message)
            throw new Error(addAccountResponse.message)
          }
        }
      }
      await setUserAccountBalances()
      console.log('user.value after connecting wallet :>> ', user.value)
      return {
        error: false,
        message: 'Successfully connected wallet',
        data: user.value
      }
    } catch (error) {
      console.error('There was an error in connectWallet :>> ', error)
      return {
        error: true,
        message: `There was an error connecting your wallet: ${error}`
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

  async function getAccountBalance(account: Account) {
    // TODO: Find where api endpoint is configured for ethers.
    try {
      const balance = await getEthersBalance(account.address)
      return balance
    } catch (err) {
      console.error('There was an error in getAccountBalance :>> ', err)
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
    try {
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
      } else if (selectedProvider.value === 'WalletConnect'){
        return await loginWithWalletConnect(loginCredentials)
      } else {
        // TODO: Implement this for other providers
        console.log('Sign up not yet supported for this wallet provider')
      }
    } catch (error) {
      console.error('There was an error in login :>> ', error)
      throw new Error('There was an error logging in: ' + error)
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
    const txRequest: TransactionRequest = {
      from: selectedAddress.value,
      to: toAddress.value,
      value: amount.value,
      providerString: selectedProvider.value,
      currency: selectedCurrency.value || ''
    }

    try {
      if (txRequest.providerString === 'WalletConnect') {
        await sendWalletConnectTransaction(txRequest)
      } else if (ethersProviderList.includes(txRequest.providerString)) {
        await sendEthersTransaction(txRequest)
      } else if (solanaProviderList.includes(txRequest.providerString)) {
        await sendSolanaTransaction(txRequest)
      } else if (selectedProvider.value === 'IoPay') {
        // await sendIoPayTransaction(txRequest)
      } else if (selectedProvider.value === 'Ledger') {
        await sendLedgerTransaction(txRequest)
      } else if (selectedProvider.value === 'Trezor') {
        await sendTrezorTransaction(txRequest)
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
  async function selectAddress(address: any, pathIndex?: string) : Promise<ErrorSuccessInterface> {
    try {
      address = trimAndLowercaseAddress(address)
      setSelectedAddress(address)
      
      if (pathIndex) setSelectedPathIndex(pathIndex)
      const { sameAddress, sameProvider } : ExistingUserCheck = await checkIfPrimaryUserExists(selectedProvider.value, selectedAddress.value)
      if (sameAddress && sameProvider ) {
        await connectWallet() // login
        return {
          error: false,
          message: 'Address already exists as a primary address using this provider',
        }
      } else if (sameAddress && !sameProvider) {
        // TODO: Handle this on front-end: do you want to change your primary provider?
        throw new Error('Address already exists as a primary address using another provider')
      }
      
      const accountsIfSecondaryAddress : Account[] | void = await checkIfSecondaryAddress(selectedAddress.value)
      console.log('accountsIfSecondaryAddress :>> ', accountsIfSecondaryAddress)
      if (accountsIfSecondaryAddress.length) {
        throw new Error(`${selectedAddress.value} already exists as a secondary address on this/these account(s): ${JSON.stringify(accountsIfSecondaryAddress)}`)
      } else {
        await connectWallet() // sign up or add account
        return {
          error: false,
          message: 'Address does not exist as a primary address using this provider',
        }
      }
    } catch (error) {
      // TODO: @shanejearley - What do we want to do here?
      console.error('Error in selectAddress: ', error.message)
      return {
        error: true,
        message: error.message
      }
    }
  }

  /**
   * Sets the selected provider and returns the set of addresses available for the selected provider
   * @param provider 
   * @param currency 
   */
  async function selectProvider(provider: ProviderString, currency: Currency = 'ETH'): Promise<ErrorSuccessInterface> {
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
      }
      return {
        error: false,
        message: 'Successfully selected provider'
      }
    } catch (error) {
      console.error('selectProvider error: ', error)
      return {
        error: true,
        message: error.message as string || 'Error selecting provider',
        data: error.name as string || null
      }
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
    try {
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
    } catch (error) {
      console.error('setUserAccountBalances error: ', error)
      throw new Error('Error setting user account balances')
    }
  }

  function setUserAddresses(addresses: CryptoAddress[]) {
    userAddresses.value = addresses
  }

  async function signMessage(message: string) {
    const messageRequest: MessageRequest = {
      message,
      providerString: selectedProvider.value,
      currency: selectedCurrency.value || ''
    }
    try {
      if (messageRequest.providerString === 'WalletConnect') {
        await signWalletConnectMessage(messageRequest)
      } else if (ethersProviderList.includes(messageRequest.providerString)) {
        await signEthersMessage(messageRequest)
      } else if (solanaProviderList.includes(messageRequest.providerString)) {
        await signSolanaMessage(messageRequest)
      } else if (messageRequest.providerString === 'IoPay') {
        // await signIoPayMessage(messageRequest)
      } else if (messageRequest.providerString === 'Ledger') {
        await signLedgerMessage(messageRequest)
      } else if (messageRequest.providerString === 'Trezor') {
        await signTrezorMessage(messageRequest)
      } else {
        console.log('signMessage not yet supported for this wallet provider')
      }
    } catch (error) {
      console.error(error)
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
    signMessage,
    switchNetwork,
    toAddress,
    userAddresses
  }
}