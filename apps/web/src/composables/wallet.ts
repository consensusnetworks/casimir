import { ref } from 'vue'
import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useIoPay from '@/composables/iopay'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useEthers from '@/composables/ethers'
import useWalletConnect from '@/composables/walletConnect'
import useSolana from '@/composables/solana'
import useSSV from '@/composables/ssv'
import useUsers from '@/composables/users'
import { ProviderString } from '@/types/ProviderString'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import { Pool } from '@/interfaces/Pool'
import { AppString } from '@/interfaces/AppString'

const amount = ref<string>('0.0')
const toAddress = ref<string>('0x728474D29c2F81eb17a669a7582A2C17f1042b57')
const amountToStake = ref<string>('0.0')
const pools = ref<Pool[]>([])
const selectedProvider = ref<ProviderString>('MetaMask')
const selectedAccount = ref<string>('0xd557a5745d4560B24D36A68b52351ffF9c86A212')
const loggedIn = ref(false)
const primaryAccount = ref('')
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test solana address: 7aVow9eVQjwn7Y4y7tAbPM1pfrE1TzjmJhxcRt8QwX5F
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

export default function useWallet() {
  const { ethereumURL } = useEnvironment()
  const { ssv, getSSVFeePercent } = useSSV()
  const { ethersProviderList, getEthersBrowserSigner, getEthersAddress, sendEthersTransaction, signEthersMessage, loginWithEthers } = useEthers()
  const { solanaProviderList, getSolanaAddress, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getIoPayAddress, sendIoPayTransaction, signIoPayMessage } = useIoPay()
  const { getBitcoinLedgerAddress, getEthersLedgerAddress, getEthersLedgerSigner, sendEthersLedgerTransaction, signEthersLedgerMessage } = useLedger()
  const { getTrezorAddress, getEthersTrezorSigner, sendTrezorTransaction, signTrezorMessage } = useTrezor()
  const { isWalletConnectSigner, getWalletConnectAddress, getEthersWalletConnectSigner, sendWalletConnectTransaction, signWalletConnectMessage } = useWalletConnect()
  const { updatePrimaryAccount } = useUsers()

  const setSelectedProvider = (provider: ProviderString) => {
    selectedProvider.value = provider
  }
  const setSelectedAccount = (address: string) => {
    selectedAccount.value = address
  }

  async function connectWallet(provider: ProviderString, app?: AppString) {
    try {
      setSelectedProvider(provider)
      selectedAccount.value = 'Not Active'
      if (provider === 'WalletConnect') {
        const address = await getWalletConnectAddress()
        setSelectedAccount(address)
      } else if (ethersProviderList.includes(provider)) {
        const address = await getEthersAddress(provider)
        setSelectedAccount(address)
      } else if (solanaProviderList.includes(provider)) {
        const address = await getSolanaAddress(provider)
        setSelectedAccount(address)
      } else if (provider === 'IoPay') {
        const address = await getIoPayAddress()
        setSelectedAccount(address)
      } else if (provider === 'Ledger') {
        const getLedgerAddress = {
          'bitcoin': getBitcoinLedgerAddress,
          'ethereum': getEthersLedgerAddress
        }[app as AppString]
        const address = await getLedgerAddress()
        setSelectedAccount(address)
      } else if (provider === 'Trezor') {
        const address = await getTrezorAddress()
        setSelectedAccount(address)
      } else {
        throw new Error('No provider selected')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function sendTransaction() {
    const txInit: TransactionInit = {
      from: selectedAccount.value,
      to: toAddress.value,
      value: amount.value,
      providerString: selectedProvider.value
    }

    try {
      if (txInit.providerString === 'WalletConnect') {
        await sendWalletConnectTransaction(txInit)
      } else if (ethersProviderList.includes(txInit.providerString)) {
        await sendEthersTransaction(txInit)
      } else if (solanaProviderList.includes(txInit.providerString)) {
        await sendSolanaTransaction(txInit)
      } else if (selectedProvider.value === 'IoPay') {
        await sendIoPayTransaction(txInit)
      } else if (selectedProvider.value === 'Ledger') {
        await sendEthersLedgerTransaction(txInit)
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
    }
    try {
      if (messageInit.providerString === 'WalletConnect') {
        await signWalletConnectMessage(messageInit)
      } else if (ethersProviderList.includes(messageInit.providerString)) {
        await signEthersMessage(messageInit)
      } else if (solanaProviderList.includes(messageInit.providerString)) {
        await signSolanaMessage(messageInit)
      } else if (messageInit.providerString === 'IoPay') {
        await signIoPayMessage(messageInit)
      } else if (messageInit.providerString === 'Ledger') {
        await signEthersLedgerMessage(messageInit)
      } else if (messageInit.providerString === 'Trezor') {
        await signTrezorMessage(messageInit)
      } else {
        console.log('signMessage not yet supported for this wallet provider')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function getUserBalance(userAddress: string): Promise<ethers.BigNumber> {
    const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    return await provider.getBalance(userAddress)
  }

  async function getUserPools(userAddress: string): Promise<Pool[]> {
    const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    const ssvProvider = ssv.connect(provider)
    const usersPoolsIds = await ssvProvider.getUserPoolIds(userAddress)
    return await Promise.all(usersPoolsIds.map(async (poolId: number) => {

      const { stake: totalStake, rewards: totalRewards } = await ssvProvider.getPoolBalance(poolId)
      const { stake: userStake, rewards: userRewards } = await ssvProvider.getPoolUserBalance(poolId, userAddress)

      let pool: Pool = {
        id: poolId,
        totalStake: ethers.utils.formatEther(totalStake),
        totalRewards: ethers.utils.formatEther(totalRewards),
        userStake: ethers.utils.formatEther(userStake),
        userRewards: ethers.utils.formatEther(userRewards)
      }

      const validatorPublicKey = await ssvProvider.getPoolValidatorPublicKey(poolId) // Public key bytes (i.e., 0x..)
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

        const operatorIds = await ssvProvider.getPoolOperatorIds(poolId) // Operator ID uint32[] (i.e., [1, 2, 3, 4])
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
    /***/

    /** Todo move to ssv.ts: depositToSSV */
    const ssvProvider = ssv.connect(signer as ethers.Signer)
    const feesTotalPercent = await getSSVFeePercent(signer as ethers.Signer)
    const depositAmount = parseFloat(amountToStake.value) * ((100 + feesTotalPercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const result = await ssvProvider.deposit({ value, type: 0 })
    return await result.wait()
  }

  async function login() { 
    if (ethersProviderList.includes(selectedProvider.value)) {
      const result = await loginWithEthers(selectedProvider.value, selectedAccount.value)
      console.log('login result :>> ', result)
      if (!result.error) {
        loggedIn.value = true
        primaryAccount.value = result.data
      } else {
        alert('There was an error logging in. Please try again.')
      }
    } else {
      console.log('Login not yet supported for this wallet provider')
    }
  }

  async function setPrimaryWalletAccount() {
    if (!loggedIn.value) {
      alert('Please login first')
    }
    
    if (ethersProviderList.includes(selectedProvider.value)) {
      const result = await updatePrimaryAccount(primaryAccount.value, selectedProvider.value, selectedAccount.value)
      const resultJSON = await result.json()
      primaryAccount.value = resultJSON.data.primaryAccount
    }
  }

  return {
    loggedIn,
    selectedProvider,
    selectedAccount,
    primaryAccount,
    toAddress,
    amount,
    amountToStake,
    pools,
    connectWallet,
    setPrimaryWalletAccount,
    sendTransaction,
    signMessage,
    deposit,
    login,
    getUserBalance,
    getUserPools
  }
}