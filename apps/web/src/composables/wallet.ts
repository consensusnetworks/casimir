import { ref } from 'vue'
import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useEthers from '@/composables/ethers'
import useWalletConnect from '@/composables/walletConnect'
import useSolana from '@/composables/solana'
import useSSV from '@/composables/ssv'
import useUsers from '@/composables/users'
import { Account, ProviderString } from '@casimir/types'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import { Pool } from '@casimir/types/src/interfaces/Pool'
import { Currency } from '@casimir/types'
import * as Session from 'supertokens-web-js/recipe/session'

// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test ethereum send to address : 0xd557a5745d4560B24D36A68b52351ffF9c86A212
// Test solana address: 7aVow9eVQjwn7Y4y7tAbPM1pfrE1TzjmJhxcRt8QwX5F
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme
// Test bitcoin send to address : 2N3Petr4LMH9tRneZCYME9mu33gR5hExvds
const loggedIn = ref(false)
const selectedProvider = ref<ProviderString>('')
const selectedAddress = ref<string>('')
const selectedCurrency = ref<Currency>('')
const primaryAddress = ref('')
const toAddress = ref<string>('2N3Petr4LMH9tRneZCYME9mu33gR5hExvds')
const amount = ref<string>('0.000001')
const amountToStake = ref<string>('0.0')
const pools = ref<Pool[]>([])
const session = ref<boolean>(false)

export default function useWallet() {
  const { ethereumURL } = useEnvironment()
  const { ssvManager, getSSVFeePercent } = useSSV()
  const { ethersProviderList, getEthersBrowserSigner, getEthersAddress, getEthersBalance, sendEthersTransaction, signEthersMessage, signupLoginWithEthers, getEthersBrowserProviderSelectedCurrency, switchEthersNetwork } = useEthers()
  const { solanaProviderList, getSolanaAddress, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getBitcoinLedgerAddress, getEthersLedgerAddress, getEthersLedgerSigner, sendLedgerTransaction, signLedgerMessage } = useLedger()
  const { getTrezorAddress, getEthersTrezorSigner, sendTrezorTransaction, signTrezorMessage } = useTrezor()
  const { isWalletConnectSigner, getWalletConnectAddress, getEthersWalletConnectSigner, sendWalletConnectTransaction, signWalletConnectMessage } = useWalletConnect()
  const { user, getUserFromAPI, addAccount, removeAccount, updatePrimaryAddress } = useUsers()
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

  async function getUserAccount() {
    session.value = await Session.doesSessionExist()
    if (session.value) {
      await getUserFromAPI()
    }
  }

  async function connectWallet(provider: ProviderString, currency?: Currency) {
    try { // Sign Up or Login
      if (!loggedIn.value) {
        const connectedAddress = await getConnectedAddress(provider, currency)
        const connectedCurrency = await detectCurrency(provider) as Currency
        const response = await signupOrLogin(provider, connectedAddress, connectedCurrency)
        if (!response?.error) {
          await getUserAccount()
          setSelectedProvider(provider)
          setSelectedAddress(connectedAddress)
          setSelectedCurrency(connectedCurrency)
          loggedIn.value = true
          primaryAddress.value = user.value?.address as string
        }
      } else { // Add account
        console.log('already logged in!')
        const connectedAddress = await getConnectedAddress(provider, currency) // TODO: Remove currency from here? Maybe not.
        const connectedCurrency = await detectCurrency(provider) as Currency
        const response = await addAccount(provider, connectedAddress, connectedCurrency)
        if (!response?.error) {
          setSelectedProvider(provider)
          setSelectedAddress(connectedAddress)
          setSelectedCurrency(connectedCurrency)
          primaryAddress.value = response.data.address
        }
      }
      console.log('user.value :>> ', user.value)
    } catch (error) {
      console.error(error)
    }
  }
  async function getConnectedAddress(provider: ProviderString, currency?: Currency) {
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

  async function signupOrLogin(provider: ProviderString, address: string, currency: Currency) {
    if (ethersProviderList.includes(provider)) {
      const result = await signupLoginWithEthers(provider, address, currency)
      if (result.error) {
        console.log('result in signupOrLogin in wallet.ts :>> ', result)
        alert('There was an error signing up. Please try again.')
      } 
      return result
    } else {
      // TODO: Implement this for other providers
      console.log('Sign up not yet supported for this wallet provider')
    }
  }

  async function setPrimaryWalletAccount() {
    if (!loggedIn.value) {
      alert('Please login first')
    }
    
    // TODO: Implement this for other providers
    if (ethersProviderList.includes(selectedProvider.value)) {
      const result = await updatePrimaryAddress(primaryAddress.value, selectedProvider.value, selectedAddress.value)
      const resultJSON = await result.json()
      console.log('resultJSON :>> ', resultJSON)
      if (!resultJSON.error) {
        primaryAddress.value = resultJSON.data.address
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

  async function detectCurrency(provider: ProviderString) {
    // TODO: Implement this for other providers
    if (ethersProviderList.includes(provider)){
      return await getEthersBrowserProviderSelectedCurrency(provider) as Currency
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
    const result = await provider.getBalance(userAddress)
    console.log('result :>> ', result)
    return result
  }

  async function getUserPools(userAddress: string): Promise<Pool[]> {
    const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    ssvManager.connect(provider)
    const usersPoolsIds = await ssvManager.getUserPoolIds(userAddress)
    return await Promise.all(usersPoolsIds.map(async (poolId: number) => {
      const { balance, userBalance } = await ssvManager.getPoolUserDetails(poolId, userAddress)
      let pool: Pool = {
        id: poolId,
        rewards: ethers.utils.formatEther(balance.rewards),
        stake: ethers.utils.formatEther(balance.stake),
        userRewards: ethers.utils.formatEther(userBalance.rewards),
        userStake: ethers.utils.formatEther(userBalance.stake)
      }

      const validatorPublicKey = await ssvManager.getPoolValidatorPublicKey(poolId) // Public key bytes (i.e., 0x..)
      if (validatorPublicKey) {

        const response = await fetch(`https://prater.beaconcha.in/api/v1/validator/${validatorPublicKey}`)
        const { data } = await response.json()
        const { status } = data
        const validator = {
          publicKey: validatorPublicKey,
          status: (status.charAt(0).toUpperCase() + status.slice(1)).replace('_status', ''),
          effectiveness: '0%',
          apr: '0%', // See issue #205 https://github.com/consensusnetworks/casimir/issues/205#issuecomment-1338142532
          url: `https://prater.beaconcha.in/validator/${validatorPublicKey}`
        }

        const operatorIds = await ssvManager.getPoolOperatorIds(poolId) // Operator ID uint32[] (i.e., [1, 2, 3, 4])
        const operators = await Promise.all(operatorIds.map(async (operatorId: number) => {
          const response = await fetch(`https://api.ssv.network/api/v1/operators/${operatorId}`)
          const { performance } = await response.json()
          return {
            id: operatorId,
            '24HourPerformance': performance['24h'],
            '30DayPerformance': performance['30d'],
            url: `https://explorer.ssv.network/operators/${operatorId}`
          }
        }))

        pool = {
          ...pool,
          validator,
          operators
        }
      }

      return pool
    }))
  }

  /** Todo accept options (specify contract/protocol i.e., ssv) */
  async function deposit() {

    /** Todo move to ethers.ts: getEthersSigner */
    const signerCreators = {
      'Browser': getEthersBrowserSigner,
      'Ledger': getEthersLedgerSigner,
      'Trezor': getEthersTrezorSigner,
      'WalletConnect': getEthersWalletConnectSigner
    }
    const signerType = ['MetaMask', 'CoinbaseWallet'].includes(selectedProvider.value) ? 'Browser' : selectedProvider.value
    const signerCreator = signerCreators[signerType  as keyof typeof signerCreators]
    let signer = signerCreator(selectedProvider.value)
    if (isWalletConnectSigner(signer)) signer = await signer
    ssvManager.connect(signer as ethers.Signer)
    const feesTotalPercent = await getSSVFeePercent()
    const depositAmount = parseFloat(amountToStake.value) * ((100 + feesTotalPercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const result = await ssvManager.deposit({ value, type: 0 })
    return await result.wait()
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
    pools,
    connectWallet,
    setPrimaryWalletAccount,
    removeConnectedAccount,
    detectCurrency,
    getCurrentBalance,
    sendTransaction,
    signMessage,
    getUserBalance,
    getUserPools,
    deposit,
    switchNetwork
  }
}