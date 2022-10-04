import { ref } from 'vue'
import { ethers } from 'ethers'
import useIoPay from '@/composables/iopay'
import useLedger from '@/composables/ledger'
import useEthers from '@/composables/ethers'
import useWalletConnect from '@/composables/walletConnect'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@/types/ProviderString'

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
}
const ethersProviderList = ['MetaMask', 'CoinbaseWallet']

const { requestEthersAccount } = useEthers()
const {
  enableWalletConnect,
  disableWalletConnect,
  sendWalletConnectTransaction,
} = useWalletConnect()

const amount = ref<string>('0.001')
const toAddress = ref<string>('0x728474D29c2F81eb17a669a7582A2C17f1042b57')
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

export default function useWallet() {
  const { getIoPayAccounts, sendIoPayTransaction, signIoPayMessage } =
    useIoPay()
  const {
    bip32Path,
    getLedgerEthSigner,
    signMessageWithLedger,
    sendLedgerTransaction,
  } = useLedger()
  const ethereum: any = window.ethereum
  const availableProviders = ref<BrowserProviders>(
    getBrowserProviders(ethereum)
  )
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
      if (provider === 'WalletConnect') {
        enableWalletConnect()
      } else if (ethersProviderList.includes(provider)) {
        const browserExtensionProvider =
          availableProviders.value[provider as keyof BrowserProviders]
        const accounts = await requestEthersAccount(
          browserExtensionProvider as EthersProvider
        )
        const address = accounts[0]
        setSelectedAccount(address)
      } else if (provider === 'IoPay') {
        const accounts = await getIoPayAccounts()
        const { address } = accounts[0]
        setSelectedAccount(address)
      } else if (provider === 'Ledger') {
        const ledgerEth = await getLedgerEthSigner()
        const { address } = await ledgerEth.getAddress(bip32Path)
        setSelectedAccount(address)
      } else {
        throw new Error('No provider selected')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // TODO: Fold this into the logic of switching to/from other wallet provider depending on front-end implementation
  async function disconnectWallet(provider: ProviderString) {
    selectedAccount.value = ''
    selectedProvider.value = ''
    if (provider === 'WalletConnect') {
      await disableWalletConnect()
    }
  }

  async function sendTransaction(provider: string) {
    try {
      if (provider === 'WalletConnect') {
        await sendWalletConnectTransaction(amount.value, toAddress.value)
      } else if (ethersProviderList.includes(provider)) {
        // Move this into ethers composable mimicking ledger composable
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
        const { hash } = await signer.sendTransaction(tx)
        console.log('Transaction sent', hash)
      } else if (selectedProvider.value === 'IoPay') {
        await sendIoPayTransaction(toAddress.value, amount.value)
      } else if (selectedProvider.value === 'Ledger') {
        const transactionInit = {
          from: selectedAccount.value,
          to: toAddress.value,
          value: amount.value
        }
        const { hash } = await sendLedgerTransaction(transactionInit)
        console.log('Transaction sent', hash)
      } else {
        throw new Error('Provider selected not yet supported')
      }
    } catch (error) {
      console.error('sendTransaction error: ', error)
    }
  }

  async function signMessage(message: string) {
    try {
      if (ethersProviderList.includes(selectedProvider.value)) {
        const browserProvider =
          availableProviders.value[
            selectedProvider.value as keyof BrowserProviders
          ]
        const web3Provider: ethers.providers.Web3Provider =
          new ethers.providers.Web3Provider(browserProvider as EthersProvider)
        const signer = web3Provider.getSigner()
        const hashedMessage = ethers.utils.id(message)
        const signature = await signer.signMessage(hashedMessage)
        // TODO: Mock sending hash and signature to backend for verification
        console.log('message :>> ', message)
        console.log('hashedMessage :>> ', hashedMessage)
        console.log('signature: ', signature)
      } else if (selectedProvider.value === 'IoPay') {
        const hashedMessage = ethers.utils.id(message)
        await signIoPayMessage(hashedMessage)
      } else if (selectedProvider.value === 'Ledger') {
        const signedHash = await signMessageWithLedger(message)
        // TODO: Send to backend for verification
      } else {
        console.log('signMessage not yet supported for this wallet provider')
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
    disconnectWallet,
    sendTransaction,
    signMessage,
  }
}

function getBrowserProviders(ethereum: any) {
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
}
