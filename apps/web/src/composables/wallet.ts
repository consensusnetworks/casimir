import { ref } from 'vue'
import { ethers } from 'ethers'
import useIoPay from '@/composables/iopay'
import useLedger from '@/composables/ledger'
import useEthers from '@/composables/ethers'
import useWalletConnect from '@/composables/walletConnect'
import useSolana from '@/composables/solana'
import useSSV from '@/composables/ssv'
import { ProviderString } from '@/types/ProviderString'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'

const amount = ref<string>('0.001')
const toAddress = ref<string>('0x728474D29c2F81eb17a669a7582A2C17f1042b57')
const contractAddress = ref<string>('')
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test solana address: 7aVow9eVQjwn7Y4y7tAbPM1pfrE1TzjmJhxcRt8QwX5F
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

export default function useWallet() {
  const { ethersProviderList, getEthersSigner, getEthersAddress, sendEthersTransaction, signEthersMessage } = useEthers()
  const { solanaProviderList, getSolanaAddress, sendSolanaTransaction, signSolanaMessage } = useSolana()
  const { getIoPayAddress, sendIoPayTransaction, signIoPayMessage } = useIoPay()
  const { getLedgerAddress, sendLedgerTransaction, signLedgerMessage } = useLedger()
  const { enableWalletConnect,  sendWalletConnectTransaction, disableWalletConnect } = useWalletConnect()
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
      if (selectedProvider.value === 'WalletConnect' && provider !== 'WalletConnect') {
        await disableWalletConnect()
      }
      setSelectedProvider(provider)
      selectedAccount.value = 'Not Active'
      if (provider === 'WalletConnect') {
        enableWalletConnect()
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
        const address = await getLedgerAddress()
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
        await sendLedgerTransaction(txInit)
      } else {
        throw new Error('Provider selected not yet supported')
      }
    } catch (error) {
      console.error('sendTransaction error: ', error)
    }
  }

  async function signMessage(message: string) {
    const messageInit: MessageInit = {
      hashedMessage: ethers.utils.id(message),
      providerString: selectedProvider.value,
    }
    // TODO: Mock sending hash and signature to backend for verification
    try {
      if (ethersProviderList.includes(messageInit.providerString)) {
        await signEthersMessage(messageInit)
      } else if (solanaProviderList.includes(messageInit.providerString)) {
        await signSolanaMessage(messageInit)
      } else if (messageInit.providerString === 'IoPay') {
        await signIoPayMessage(messageInit)
      } else if (messageInit.providerString === 'Ledger') {
        await signLedgerMessage(messageInit)
      } else {
        console.log('signMessage not yet supported for this wallet provider')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const deposit = async () => {
    const { ssv } = useSSV()
    if (selectedProvider.value === 'MetaMask' || selectedProvider.value === 'CoinbaseWallet') {
      const signer = getEthersSigner(selectedProvider.value)
      const value = ethers.utils.parseEther(amount.value)
      const { hash } = await ssv.connect(signer).deposit({ value })
      console.log('hash :>> ', hash)
    } else {
      alert('Please connect to MetaMask or Coinbase Wallet in order to stake ETH')
    }
    return
  }

  return {
    selectedProvider,
    selectedAccount,
    toAddress,
    amount,
    contractAddress,
    connectWallet,
    sendTransaction,
    signMessage,
    deposit
  }
}


