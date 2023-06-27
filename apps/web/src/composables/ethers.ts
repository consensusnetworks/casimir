import { ethers } from 'ethers'
import { EthersProvider } from '@/interfaces/index'
import { Account, TransactionRequest } from '@casimir/types'
import { GasEstimate, LoginCredentials, MessageRequest, ProviderString } from '@casimir/types'
import useAuth from '@/composables/auth'
import useContracts from '@/composables/contracts'
import useEnvironment from '@/composables/environment'
import usePrice from '@/composables/price'
import useUsers from '@/composables/users'

const { createSiweMessage, signInWithEthereum } = useAuth()
const { ethereumURL } = useEnvironment()
const { manager, stakingRewards, getUserContractEventsTotals, setUserContractTotals } = useContracts()
const { getCurrentPrice } = usePrice()
const { user } = useUsers()

export default function useEthers() {
  const ethersProviderList = ['BraveWallet', 'CoinbaseWallet', 'MetaMask', 'OkxWallet', 'TrustWallet']

  async function addEthersNetwork (providerString: ProviderString, network: any) {
    const provider = getBrowserProvider(providerString)
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [network]
      })
    } catch(error) {
      console.log(`Error occurred while adding network ${network.chainName}, Message: ${error.message} Code: ${error.code}`)
    }
  }

  /**
   * Estimate gas fee using EIP 1559 methodology
   * @returns string in ETH
   */
  async function estimateEIP1559GasFee(rpcUrl: string, unsignedTransaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>) : Promise<GasEstimate> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      const gasPrice = await provider.getFeeData() as ethers.providers.FeeData
      const { maxFeePerGas, maxPriorityFeePerGas } = gasPrice
      const maxFeePerGasInWei = maxFeePerGas ? ethers.utils.parseEther(maxFeePerGas.toString()) : '0'
      const maxPriorityFeePerGasInWei = maxPriorityFeePerGas ? ethers.utils.parseEther(maxPriorityFeePerGas.toString()) : '0'
      if (maxFeePerGasInWei === '0') throw new Error('maxFeePerGasInWei is zero')
      if (maxPriorityFeePerGasInWei === '0') throw new Error('maxPriorityFeePerGasInWei is zero')

      const { to, from, value } = unsignedTransaction
      const tx = {
        from,
        to,
        value,
        type: 2, // TODO: 2 is for EIP 1559, 0 is for legacy; make this dynamic
        maxFeePerGas: maxFeePerGasInWei,
        maxPriorityFeePerGas: maxPriorityFeePerGasInWei
      }
      const gasEstimate = await provider.estimateGas(tx)
      // TODO: What is the way to get gas estimate in human readable format?
      // const gasEstimateInEth = ethers.utils.formatEther(gasEstimate)
      const fee = maxPriorityFeePerGasInWei?.mul(gasEstimate).add(maxFeePerGasInWei)
      const feeInWei = ethers.utils.formatEther(fee)
      const feeInEth = (parseInt(feeInWei) / 10**18).toFixed(8).toString()
      return {
        gasLimit: gasEstimate.toString(),
        fee: feeInEth
      }
    } catch (err) {
      console.error('There was an error in estimateGasFee :>> ', err)
      return {
        gasLimit: '0',
        fee: '0'
      }
    }
  }

  /**
   * Estimate gas fee using legacy methodology
   * @returns string in ETH
   * @deprecated
   * @see estimateEIP1559GasFee
  */
  async function estimateLegacyGasFee(rpcUrl: string, unsignedTransaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>) : Promise<GasEstimate> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      const gasPrice = await provider.getGasPrice()
      const gasEstimate = await provider.estimateGas(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
      const fee = gasPrice.mul(gasEstimate)
      const feeInWei = ethers.utils.formatEther(fee)
      const feeInEth = (parseInt(feeInWei) / 10**18).toFixed(8).toString()
      return {
        gasLimit: gasEstimate.toString(),
        fee: feeInEth
      }
    } catch (err) {
      console.error('There was an error in estimateGasFee :>> ', err)
      return {
        gasLimit: '0',
        fee: '0'
      }
    }
  }

  async function getEthersAddressWithBalance (providerString: ProviderString) {
    const provider = getBrowserProvider(providerString)
    
    if (provider) {
      const address = (await requestEthersAccount(provider as EthersProvider))[0]
      const balance = await getEthersBalance(address)
      return [{ address, balance }]
    } else {
      throw new Error('Provider not yet connected to this dapp. Please connect and try again.')
    }
  }

  async function getEthersBalance(address: string) : Promise<GLfloat> {
    const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    const balance = await provider.getBalance(address)
    return parseFloat(ethers.utils.formatEther(balance))
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
    const provider = getBrowserProvider(providerString)
    if (provider) {
      return new ethers.providers.Web3Provider(provider as EthersProvider).getSigner()
    }
  }

  async function getEthersBrowserProviderSelectedCurrency(providerString: ProviderString) {
    // IOTEX Smart Contract Address: 0x6fb3e0a217407efff7ca062d46c26e5d60a14d69
    const browserProvider = getBrowserProvider(providerString)
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const network = await web3Provider.getNetwork()
    // console.log('network.chainId :>> ', network.chainId)
    const { currency } = currenciesByChainId[network.chainId.toString() as keyof typeof currenciesByChainId]
    return currency
  }

  async function getMaxETHAfterFees(rpcUrl: string, unsignedTx: ethers.utils.Deferrable<ethers.providers.TransactionRequest>, totalAmount: string) {
    const { fee } = await estimateEIP1559GasFee(rpcUrl, unsignedTx)
    const total = parseInt(totalAmount) - parseInt(fee)
    const maxAfterFees = ethers.utils.formatEther(total).toString()
    return maxAfterFees
  }

  function getUserEventPromises() {
    const promises = [] as Array<Promise<any>>
    user.value?.accounts?.forEach((account: Account) => {
      const { address } = account
      promises.push(getUserContractEventsTotals(address))
    })
    return promises
  }

  async function refreshUserEventsTotals(promises: Array<Promise<any>>) {
    try {
      const userEventTotals = (await Promise.all(promises)).reduce((acc, curr) => {
        return {
          StakeDeposited: acc.StakeDeposited + curr.StakeDeposited,
          StakeRebalanced: acc.StakeRebalanced + curr.StakeRebalanced,
          WithdrawalInitiated: acc.WithdrawalInitiated + curr.WithdrawalInitiated,
        }
      }, {
        StakeDeposited: 0,
        StakeRebalanced: 0,
        WithdrawalInitiated: 0,
      })
      await setUserContractTotals(userEventTotals)
    } catch (err) {
      console.error('There was an error in refreshUserEventsTotals :>> ', err)
    }
  }

  async function listenForTransactions() {
    const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    provider.on('block', async (blockNumber: number) => {
      console.log('blockNumber :>> ', blockNumber)
      const addresses = user.value?.accounts.map((account: Account) => account.address) as Array<string>
      const block = await provider.getBlockWithTransactions(blockNumber)
      const transactions = block.transactions
      const promises = [] as Array<Promise<any>>
      transactions.map((tx) => {
        if (addresses.includes(tx.from.toLowerCase())) {
          promises.push(...getUserEventPromises())
        }
      })
      await refreshUserEventsTotals(promises)
    })
    await new Promise(() => {
      // Wait indefinitely using a Promise that never resolves
    })
  }

  async function listenForContractEvents() {
    manager.on('StakeDeposited', async (event: any) => {
      console.log('got to StakeDeposited!')
    })
    
    manager.on('StakeRebalanced', async (event: any) => {
      console.log('got to StakeRebalanced!')
      const promises = [] as Array<Promise<any>>
      promises.push(...getUserEventPromises())
      await refreshUserEventsTotals(promises)
    })
  }

  async function loginWithEthers(loginCredentials: LoginCredentials): Promise<void>{
    const { provider, address, currency } = loginCredentials
    const browserProvider = getBrowserProvider(provider)
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    try {
      const message = await createSiweMessage(address, 'Sign in with Ethereum to the app.')
      const signer = web3Provider.getSigner()
      const signedMessage = await signer.signMessage(message)
      await signInWithEthereum({ 
        address,
        currency,
        message, 
        provider, 
        signedMessage
      })
    } catch (err) {
      throw new Error(err.message)
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
    { from, to, value, providerString }: TransactionRequest
  ) {
    const signer = getEthersBrowserSigner(providerString) as ethers.Signer
    const weiAmount = ethers.utils.parseEther(value)
    const tx = {
      from,
      to,
      value: weiAmount
    }
    const ethFees = await estimateEIP1559GasFee(ethereumURL, tx)
    const { fee, gasLimit } = ethFees
    const requiredBalance = parseInt(value) + parseInt(fee)
    const balance = await getEthersBalance(from)
    if (parseInt(balance) < requiredBalance) {
      throw new Error('Insufficient balance')
    }
    console.log(`Sending ${value} ETH to ${to} with estimated ${fee} ETH in fees using ~${gasLimit.toString()} in gas.`)
    return await signer.sendTransaction(tx)
  }

  async function signEthersMessage(messageRequest: MessageRequest): Promise<string> {
    const { providerString, message } = messageRequest
    const browserProvider = getBrowserProvider(providerString)
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    const signer = web3Provider.getSigner()
    const signature = await signer.signMessage(message)
    return signature
  }

  async function switchEthersNetwork (providerString: ProviderString, chainId: string) {
    const provider = getBrowserProvider(providerString)
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
        } catch (err) {
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
    estimateEIP1559GasFee,
    estimateLegacyGasFee,
    ethersProviderList,
    getMaxETHAfterFees,
    getEthersAddressWithBalance,
    getEthersBalance,
    getEthersBrowserSigner,
    getEthersBrowserProviderSelectedCurrency,
    getGasPriceAndLimit,
    listenForContractEvents,
    listenForTransactions,
    loginWithEthers,
    requestEthersAccount,
    signEthersMessage,
    sendEthersTransaction,
    switchEthersNetwork
  }
}

function getBrowserProvider(providerString: ProviderString) {
  if (providerString === 'MetaMask' || providerString === 'CoinbaseWallet') {
    const { ethereum } = window
    if (!ethereum.providerMap && ethereum.isMetaMask) {
      return ethereum
    }
    return window.ethereum?.providerMap?.get(providerString) || undefined
  } else if (providerString === 'BraveWallet') {
    return getBraveWallet()
  } else if (providerString === 'TrustWallet') {
    return getTrustWallet()
  } else if (providerString === 'OkxWallet') {
    return getOkxWallet()
  }
}

function getBraveWallet() {
  const { ethereum } = window as any
  if (ethereum?.isBraveWallet) {
    return ethereum
  } else {
    window.open('https://brave.com/download/', '_blank')
  }
}

function getOkxWallet() {
  const { okxwallet } = window as any
  const { okexchain } = window as any
  return okxwallet || okexchain
}

function getTrustWallet() {
  const { ethereum } = window as any
  const providers = ethereum?.providers
  if (providers) {
    for (const provider of providers) {
      if (provider.isTrustWallet) return provider
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