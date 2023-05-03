import { ref } from 'vue'
import { ethers } from 'ethers'
import { BrowserProviders, EthersProvider, MessageInit, TransactionInit } from '@/interfaces/index'
import { Currency, ProviderString, CryptoAddress } from '@casimir/types'
import useAuth from '@/composables/auth'
import useEnvironment from '@/composables/environment'

const { createSiweMessage, signInWithEthereum } = useAuth()
const { ethereumURL } = useEnvironment()

const defaultProviders = {
  MetaMask: undefined,
  CoinbaseWallet: undefined,
}

const ethereum: any = window.ethereum
const availableProviders = ref<BrowserProviders>(getBrowserProviders(ethereum))

export default function useEthers() {
  const ethersProviderList = ['MetaMask', 'CoinbaseWallet']

  async function addEthersNetwork (providerString: ProviderString, network: any) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [network]
      })
    } catch(err){
      console.log(`Error occurred while adding network ${network.chainName}, Message: ${err.message} Code: ${err.code}`)
    }
  }

  async function getEthersAddress (providerString: ProviderString) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      return (await requestEthersAccount(provider as EthersProvider))
    }
  }

  async function getEthersAddressWithBalance (providerString: ProviderString) {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      const address = (await requestEthersAccount(provider as EthersProvider))[0]
      const balance = await getEthersBalance(address)
      return [{ address, balance }]
    }
  }

  async function getEthersBalance(address: string, ) {
    const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    const balance = await provider.getBalance(address)
    return ethers.utils.formatEther(balance)
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

  function getEthersBrowserSigner(providerString: ProviderString): ethers.Signer | undefined {
    const provider = availableProviders.value[providerString as keyof BrowserProviders]
    if (provider) {
      return new ethers.providers.Web3Provider(provider as EthersProvider).getSigner()
    }
  }

  async function getEthersBrowserProviderSelectedCurrency(providerString: ProviderString) {
    // IOTEX Smart Contract Address: 0x6fb3e0a217407efff7ca062d46c26e5d60a14d69
    const browserProvider = availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const network = await web3Provider.getNetwork()
    // console.log('network.chainId :>> ', network.chainId)
    const { currency } = currenciesByChainId[network.chainId.toString() as keyof typeof currenciesByChainId]
    return currency
  }

  async function loginWithEthers(provider: ProviderString, address: string, currency: Currency) {
    const browserProvider = availableProviders.value[provider as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    try {
      const message = await createSiweMessage(address, 'Sign in with Ethereum to the app.')
      const signer = web3Provider.getSigner()
      const signedMessage = await signer.signMessage(message)
      const ethersLoginResponse = await signInWithEthereum({ 
        address,
        currency,
        message, 
        provider, 
        signedMessage
      })
      return await ethersLoginResponse.json()
    } catch (err) {
      console.log('Error logging in: ', err)
      return err
    }
  }

  async function requestEthersAccount(provider: EthersProvider) {
    if (provider?.request) {
      return await provider.request({
        method: 'eth_requestAccounts',
      })
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
    addEthersNetwork,
    ethersProviderList, 
    getEthersAddress,
    getEthersAddressWithBalance,
    getEthersBalance,
    getEthersBrowserSigner, 
    getEthersBrowserProviderSelectedCurrency,
    getGasPriceAndLimit,
    loginWithEthers,
    signEthersMessage,
    sendEthersTransaction,
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