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
const toAddress = ref<string>('0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203')
// Test ethereum send to address : 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
// Test iotex send to address: acc://06da5e904240736b1e21ca6dbbd5f619860803af04ff3d54/acme

export default function useWallet() {
  const { getIoPayAccounts, sendIoPayTransaction } = useIoPay()
  const { bip32Path, getLedgerEthSigner } = useLedger()
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
        console.log('address :>> ', address)
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
        signer.sendTransaction(tx).then((txObj) => {
          console.log('successful txHash: ', txObj.hash)
        })
      } else if (selectedProvider.value === 'IoPay') {
        await sendIoPayTransaction(toAddress.value, amount.value)
      } else if (selectedProvider.value === 'Ledger') {
        // TODO: Offload this to a Ledger composable
        // TODO: Replace according to selected testnet
        const infuraProvider = new ethers.providers.JsonRpcProvider(
          'https://optimism-goerli.infura.io/v3/4e8acb4e58bb4cb9978ac4a22f3326a7'
        )
        const chainId = 5
        const gasPrice = ethers.utils.parseUnits('1.0', 'gwei').toString()
        const recipient = '0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203'
        const gasLimit = 1000000
        // TODO: Add this once we have a way to get the nonce from the ledger
        // let nonce =  await provider.getTransactionCount(selectedAccount.value, "latest");
        const _eth = await getLedgerEthSigner()

        const transaction = {
          to: recipient,
          gasPrice: '0x' + parseInt(gasPrice).toString(16),
          gasLimit: ethers.utils.hexlify(gasLimit),
          // nonce: nonce,
          chainId: chainId,
          data: '0x00',
          value: ethers.utils.parseUnits(amount.value, 'ether')._hex,
        }
        const unsignedTransaction = ethers.utils
          .serializeTransaction(transaction)
          .substring(2)

        // TODO: Add resolution as third argument in signature
        // import ledgerService from '@ledgerhq/hw-app-eth/lib/services/ledger'
        // const resolution = await ledgerService.resolveTransaction(transaction)
        // console.log('resolution :>> ', resolution)
        const signature = await _eth.signTransaction(
          bip32Path,
          unsignedTransaction
          // resolution
        )
        signature.r = '0x' + signature.r
        signature.s = '0x' + signature.s
        signature.v = parseInt(signature.v)
        signature.from = selectedAccount.value
        const signedTransaction = ethers.utils.serializeTransaction(
          transaction,
          signature
        )
        const txHash = await infuraProvider.sendTransaction(signedTransaction)
        console.log('txHash :>> ', txHash)

        // TODO: Remove after testing with speculos
        // npm run dev:ethereum in another process
        // Create - { to: ... }
        // Serialize - ethers.utils.serializeTransaction
        // Sign - ledgerEth.signTransaction
        // Send - (new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")).sendTransaction
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
    disconnectWallet,
    sendTransaction,
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
