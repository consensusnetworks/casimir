import { ref } from 'vue'
import { ethers } from 'ethers'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@casimir/types'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import useAuth from '@/composables/auth'
import { Currency } from '@casimir/types'

const { getMessage, signupOrLoginAuth, signUpAuth, login } = useAuth()

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

  async function signupLoginWithEthers(provider: ProviderString, address: string, currency: Currency) {
    const browserProvider = availableProviders.value[provider as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const messageJson = await getMessage(provider, address)
    const { message } = await messageJson.json()
    const signer = web3Provider.getSigner()
    const signature = await signer.signMessage(message)
    const response = await signupOrLoginAuth({ 
      provider, 
      address, 
      message: message.toString(), 
      signedMessage: signature,
      currency
    })
    console.log('response in signupLoginWithEthers in ethers.ts :>> ', response)
    const json = await response.json()
    console.log('json in signupLoginWithEthers in ethers.ts :>> ', json)
    return json
  }

  async function loginWithEthers (providerString: ProviderString, selectedAccount: string) {
    const browserProvider = availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const messageJson = await getMessage(providerString, selectedAccount)
    const { message } = await messageJson.json()
    const signer = web3Provider.getSigner()
    const signature = await signer.signMessage(message)
    const response = await login({ address: selectedAccount, message: message.toString(), signedMessage: signature, provider: providerString })
    return await response.json()
  }

  async function getEthersBrowserProviderSelectedCurrency(providerString: ProviderString) {
    // IOTEX Smart Contract Address: 0x6fb3e0a217407efff7ca062d46c26e5d60a14d69
    const browserProvider = availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const network = await web3Provider.getNetwork()
    const { currency } = currenciesByChainId[network.chainId.toString() as keyof typeof currenciesByChainId]
    return currency
  }

  return { ethersProviderList, getEthersBrowserSigner, getEthersAddress, getEthersBalance, sendEthersTransaction, signEthersMessage, getGasPriceAndLimit, signupLoginWithEthers, loginWithEthers, getEthersBrowserProviderSelectedCurrency }
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