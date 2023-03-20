import { ref } from 'vue'
import { ethers } from 'ethers'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@casimir/types'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import useAuth from '@/composables/auth'
import { Currency } from '@casimir/types'

const { getMessage, login } = useAuth()

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
}

const ethereum: any = window.ethereum
const availableProviders = ref<BrowserProviders>(getBrowserProviders(ethereum))

export default function useEthers() {
  const ethersProviderList = ['MetaMask', 'CoinbaseWallet']

  async function requestEthersAccount(provider: EthersProvider) {
    if (provider?.request) {
      return await provider.request({
        method: 'eth_requestAccounts',
      })
    }
  }

  // TODO: Identify the difference beteween the two functions below (requestEthersBalance and getEthersBalance)
  async function requestEthersBalance(provider: EthersProvider, address: string) {
    if (provider?.request) {
      return await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })
    }
  }

  async function getEthersBalance(providerString: ProviderString, address: string, ) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      const balance = await requestEthersBalance(provider as EthersProvider, address)
      console.log('balance :>> ', balance)
      return ethers.utils.formatEther(balance)
    }
  }

  function getEthersBrowserSigner(providerString: ProviderString): ethers.Signer | undefined {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      return new ethers.providers.Web3Provider(provider as EthersProvider).getSigner()
    }
  }

  async function getEthersAddress (providerString: ProviderString) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      return (await requestEthersAccount(provider as EthersProvider))[0]
    }
  }

  async function getBalance (providerString: ProviderString) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    try {
      if (provider?.request) {
        const balance = await provider.request({
          method: 'eth_getBalance',
          params: [await getEthersAddress(providerString), 'latest'],
        })
        return ethers.utils.formatEther(balance)
      }
    } catch (err) {
      console.log('Error getting balance: ', err)
    }
  }

  async function sendEthersTransaction(
    { to, value, providerString }: TransactionInit
  ) {
    const browserProvider =
      availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider =
      new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const signer = web3Provider.getSigner()
    const etherAmount = ethers.utils.parseEther(value)
    const tx = {
      to,
      value: etherAmount
    }
    console.log('tx :>> ', tx)
    return await signer.sendTransaction(tx)
  }

  async function signEthersMessage(messageInit: MessageInit): Promise<string> {
    const { providerString, message } = messageInit
    const browserProvider = availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider =
      new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const signer = web3Provider.getSigner()
    const signature = await signer.signMessage(message)
    return signature
  }

  async function getGasPriceAndLimit(
    rpcUrl: string,
    unsignedTransaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>
  ) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const gasPrice = await provider.getGasPrice()
    const gasLimit = await provider.estimateGas(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
    return { gasPrice, gasLimit }
  }

  async function loginWithEthers(provider: ProviderString, address: string, currency: Currency) {
    const browserProvider = availableProviders.value[provider as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    try {
      const messageJson = await getMessage(provider, address)
      const { message } = await messageJson.json()
      // Temporarily return here to make sure we're adding to db correctly.
      const signer = web3Provider.getSigner()
      const signature = await signer.signMessage(message)
      const response = await login({ 
        provider, 
        address, 
        message: message.toString(), 
        signedMessage: signature,
        currency
      })
      return await response.json()
    } catch (err) {
      console.log('Error logging in: ', err)
      return err
    }
  }

  async function getEthersBrowserProviderSelectedCurrency(providerString: ProviderString) {
    // IOTEX Smart Contract Address: 0x6fb3e0a217407efff7ca062d46c26e5d60a14d69
    const browserProvider = availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const network = await web3Provider.getNetwork()
    console.log('network.chainId :>> ', network.chainId)
    const { currency } = currenciesByChainId[network.chainId.toString() as keyof typeof currenciesByChainId]
    return currency
  }

  async function addEthersNetwork (providerString: ProviderString, network: any) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [network]
      })
    } catch(err: any){
      console.log(`Error occurred while adding network ${network.chainName}, Message: ${err.message} Code: ${err.code}`)
    }
  }

  async function switchEthersNetwork (providerString: ProviderString, chainId: string) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    const currentChainId = await provider.networkVersion
    if (chainId === '5') {
      chainId = '0x5'
    } else if (chainId === '4690') {
      chainId = ethers.utils.hexlify(4690)
    }
    if (currentChainId.toString() != chainId){
        try {
          await provider.request({
            method:'wallet_switchEthereumChain',
            params: [{chainId: chainId}]
          })
        } catch(err: any){
            console.log(`Error occurred while switching chain to chainId ${chainId}, err: ${err.message} code: ${err.code}`)
            if (err.code === 4902){
              if (chainId === '5') {
                addEthersNetwork(providerString, goerliNetwork)
              } else if (chainId === '0x1252') {
                addEthersNetwork(providerString, iotexNetwork)
            }
          }
        }
    }
  }

  return { 
    ethersProviderList, 
    getEthersBrowserSigner, 
    getEthersAddress,
    getEthersBalance,
    sendEthersTransaction,
    signEthersMessage,
    getGasPriceAndLimit,
    loginWithEthers,
    getEthersBrowserProviderSelectedCurrency,
    addEthersNetwork,
    switchEthersNetwork 
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

const currenciesByChainId = {
  '1': {
    name: 'Mainnet ETH',
    currency: 'ETH',
  },
  '3': {
    name: 'Ropsten ETH',
    currency: 'ETH',
  },
  '4': {
    name: 'Rinkeby ETH',
    currency: 'ETH',
  },
  '5': {
    name: 'Goerli ETH',
    currency: 'ETH',
  },
  '42': {
    name: 'Kovan ETH',
    currency: 'ETH',
  },
  '56': {
    name: 'Binance Smart Chain',
    currency: 'BNB',
  },
  '97': {
    name: 'Binance Smart Chain Testnet',
    currency: 'BNB',
  },
  '137': {
    name: 'Polygon',
    currency: 'MATIC',
  },
  '31337': {
    name: 'Localhost Network',
    currency: 'ETH',
  },
  '80001': {
    name: 'Polygon Testnet',
    currency: 'MATIC',
  },
  '4690': {
    name: 'IoTeX',
    currency: 'IOTX',
  },
  '4691': {
    name: 'IoTeX Testnet',
    currency: 'IOTX',
  },
}
const iotexNetwork = {
  chainId: ethers.utils.hexlify(4690),
  chainName: 'IoTeX',
  nativeCurrency: {
      name: 'IoTeX',
      symbol: 'IOTX',
      decimals: 18
  },
  rpcUrls: ['https://api.testnet.iotex.one:80', 'http://api.testnet.iotex.one:80'],
  blockExplorerUrls: ['https://iotexscan.io']
}

const goerliNetwork = {
  chainId: '0x5',
  chainName: 'Goerli Testnet',
  nativeCurrency: {
      name: 'Goerli',
      symbol: 'GÖETH',
      decimals: 18
  },
  rpcUrls: ['https://goerli.infura.io/v3/6b9f3a5d3d5e4c8e9b5d1f0c3e5f1e4a'],
  blockExplorerUrls: ['https://goerli.etherscan.io']
}