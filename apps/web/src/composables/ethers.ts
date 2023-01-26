import { ref } from 'vue'
import { ethers } from 'ethers'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { EthersProvider } from '@/interfaces/EthersProvider'
import { ProviderString } from '@/types/ProviderString'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import useAuth from '@/composables/auth'

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

  async function loginWithEthers ( providerString: ProviderString, selectedAccount: string) {
    const browserProvider = availableProviders.value[providerString as keyof BrowserProviders]
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const messageJson = await getMessage(providerString, selectedAccount)
    const { message } = await messageJson.json()
    const signer = web3Provider.getSigner()
    const signature = await signer.signMessage(message)
    const response = await login({ address: selectedAccount, message: message.toString(), signedMessage: signature, provider: providerString })
    return await response.json()
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
    getBalance,
    sendEthersTransaction,
    signEthersMessage,
    getGasPriceAndLimit,
    loginWithEthers,
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