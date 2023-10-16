import { ethers } from "ethers"
import { CryptoAddress, EthersProvider } from "@casimir/types"
import { TransactionRequest } from "@casimir/types"
import { GasEstimate, LoginCredentials, MessageRequest, ProviderString } from "@casimir/types"
import useEnvironment from "@/composables/environment"
import useSiwe from "@/composables/siwe"

interface ethereumWindow extends Window {
  ethereum: any;
}
declare const window: ethereumWindow

const { ethereumUrl, provider } = useEnvironment()
const { createSiweMessage, signInWithEthereum } = useSiwe()

export default function useEthers() {
  const ethersProviderList = ["BraveWallet", "CoinbaseWallet", "MetaMask", "OkxWallet", "TrustWallet"]

  async function addEthersNetwork (providerString: ProviderString, network: any) {
    const provider = getBrowserProvider(providerString)
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [network]
      })
    } catch(error: any) {
      console.log(`Error occurred while adding network ${network.chainName}, Message: ${error.message} Code: ${error.code}`)
    }
  }

  async function detectActiveEthersWalletAddress(providerString: ProviderString): Promise<string> {
    const provider = getBrowserProvider(providerString)
    try {
      if (provider) {
        const accounts = await provider.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          return accounts[0] as string
        } 
        return ""
      } else {
        return ""
      }
    } catch(err) {
      console.error("There was an error in detectActiveEthersWalletAddress :>> ", err)
      return ""
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
      const maxFeePerGasInWei = maxFeePerGas ? ethers.utils.parseEther(maxFeePerGas.toString()) : "0"
      const maxPriorityFeePerGasInWei = maxPriorityFeePerGas ? ethers.utils.parseEther(maxPriorityFeePerGas.toString()) : "0"
      if (maxFeePerGasInWei === "0") throw new Error("maxFeePerGasInWei is zero")
      if (maxPriorityFeePerGasInWei === "0") throw new Error("maxPriorityFeePerGasInWei is zero")

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
      const feeInEth = (parseFloat(feeInWei) / 10**18).toFixed(8).toString()
      return {
        gasLimit: gasEstimate.toString(),
        fee: feeInEth
      }
    } catch (err) {
      console.error("There was an error in estimateGasFee :>> ", err)
      return {
        gasLimit: "0",
        fee: "0"
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
      const feeInEth = (parseFloat(feeInWei) / 10**18).toFixed(8).toString()
      return {
        gasLimit: gasEstimate.toString(),
        fee: feeInEth
      }
    } catch (err) {
      console.error("There was an error in estimateGasFee :>> ", err)
      return {
        gasLimit: "0",
        fee: "0"
      }
    }
  }

  async function getEthersAddressesWithBalances (providerString: ProviderString): Promise<CryptoAddress[]> {
    const provider = getBrowserProvider(providerString)
    if (provider) {
      const addresses = await provider.request({ method: "eth_requestAccounts" })
      const addressesWithBalance: CryptoAddress[] = []
      for (const address of addresses) {
        const balance = (await getEthersBalance(address)).toString()
        const addressWithBalance = { address, balance }
        addressesWithBalance.push(addressWithBalance)
      }
      return addressesWithBalance
    } else {
      throw new Error("Provider not yet connected to this dapp. Please connect and try again.")
    }
  }

  async function getEthersBalance(address: string) : Promise<GLfloat> {
    const balance = await provider.getBalance(address)
    return parseFloat(ethers.utils.formatEther(balance))
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

  function getEthersBrowserSigner(providerString: ProviderString): ethers.Signer | undefined {
    const provider = getBrowserProvider(providerString)
    if (provider) {
      return new ethers.providers.Web3Provider(provider as EthersProvider).getSigner()
    }
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

  async function getMaxETHAfterFees(rpcUrl: string, unsignedTx: ethers.utils.Deferrable<ethers.providers.TransactionRequest>, totalAmount: string) {
    const { fee } = await estimateEIP1559GasFee(rpcUrl, unsignedTx)
    const total = parseFloat(totalAmount) - parseFloat(fee)
    const maxAfterFees = ethers.utils.formatEther(total).toString()
    return maxAfterFees
  }

  async function loginWithEthers(loginCredentials: LoginCredentials): Promise<void>{
    const { provider, address, currency } = loginCredentials
    const browserProvider = getBrowserProvider(provider)
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(browserProvider as EthersProvider)
    try {
      const message = await createSiweMessage(address, "Sign in with Ethereum to the app.")
      const signer = web3Provider.getSigner()
      const signedMessage = await signer.signMessage(message)
      await signInWithEthereum({
        address,
        currency,
        message, 
        provider, 
        signedMessage
      })
    } catch (err: any) {
      throw new Error(err.message)
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
    const ethFees = await estimateEIP1559GasFee(ethereumUrl, tx)
    const { fee, gasLimit } = ethFees
    const requiredBalance = parseFloat(value) + parseFloat(fee)
    const balance = await getEthersBalance(from)
    if (balance < requiredBalance) {
      throw new Error("Insufficient balance")
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
    if (chainId === "5") {
      chainId = "0x5"
    } else if (chainId === "4690") {
      chainId = ethers.utils.hexlify(4690)
    }
    if (currentChainId.toString() != chainId){
      try {
        await provider.request({
          method:"wallet_switchEthereumChain",
          params: [{chainId: chainId}]
        })
      } catch (err: any) {
        console.log(`Error occurred while switching chain to chainId ${chainId}, err: ${err.message} code: ${err.code}`)
        if (err.code === 4902){
          if (chainId === "5") {
            addEthersNetwork(providerString, goerliNetwork)
          } else if (chainId === "0x1252") {
            addEthersNetwork(providerString, iotexNetwork)
          }
        }
      }
    }
  }

  return { 
    ethersProviderList,
    detectActiveEthersWalletAddress,
    getEthersAddressesWithBalances,
    getEthersBalance,
    getEthersBrowserSigner,
    getGasPriceAndLimit,
    loginWithEthers,
  }
}

function getBrowserProvider(providerString: ProviderString) {
  try {
    const { ethereum } = window
    if (providerString === "CoinbaseWallet") {
      if (!ethereum.providerMap) return alert("TrustWallet or another wallet may be interfering with CoinbaseWallet. Please disable other wallets and try again.")
      if (ethereum?.providerMap.get(providerString)) return ethereum.providerMap.get(providerString)
      else window.open("https://www.coinbase.com/wallet/downloads", "_blank")
    } else if (providerString === "MetaMask") {
      if (ethereum.providerMap && ethereum.providerMap.get("MetaMask")) {
        return ethereum?.providerMap?.get(providerString) || undefined
      } else if (ethereum.isMetaMask) {
        return ethereum
      } else {
        window.open("https://metamask.io/download.html", "_blank")
      }
    } else if (providerString === "BraveWallet") {
      return getBraveWallet()
    } else if (providerString === "TrustWallet") {
      return getTrustWallet()
    } else if (providerString === "OkxWallet") {
      return getOkxWallet()
    }
  } catch(err) {
    console.error("There was an error in getBrowserProvider :>> ", err)
  }
}

function getBraveWallet() {
  const { ethereum } = window as any
  if (ethereum?.isBraveWallet) {
    return ethereum
  } else {
    window.open("https://brave.com/download/", "_blank")
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
  if (ethereum.isTrust) return ethereum
  if (providers) {
    for (const provider of providers) {
      if (provider.isTrustWallet) return provider
    }
  }
}

const currenciesByChainId = {
  "1": {
    name: "Mainnet ETH",
    currency: "ETH",
  },
  "3": {
    name: "Ropsten ETH",
    currency: "ETH",
  },
  "4": {
    name: "Rinkeby ETH",
    currency: "ETH",
  },
  "5": {
    name: "Goerli ETH",
    currency: "ETH",
  },
  "42": {
    name: "Kovan ETH",
    currency: "ETH",
  },
  "56": {
    name: "Binance Smart Chain",
    currency: "BNB",
  },
  "97": {
    name: "Binance Smart Chain Testnet",
    currency: "BNB",
  },
  "137": {
    name: "Polygon",
    currency: "MATIC",
  },
  "31337": {
    name: "Localhost Network",
    currency: "ETH",
  },
  "80001": {
    name: "Polygon Testnet",
    currency: "MATIC",
  },
  "4690": {
    name: "IoTeX",
    currency: "IOTX",
  },
  "4691": {
    name: "IoTeX Testnet",
    currency: "IOTX",
  },
}

const iotexNetwork = {
  chainId: ethers.utils.hexlify(4690),
  chainName: "IoTeX",
  nativeCurrency: {
    name: "IoTeX",
    symbol: "IOTX",
    decimals: 18
  },
  rpcUrls: ["https://api.testnet.iotex.one:80", "http://api.testnet.iotex.one:80"],
  blockExplorerUrls: ["https://iotexscan.io"]
}

const goerliNetwork = {
  chainId: "0x5",
  chainName: "Goerli Testnet",
  nativeCurrency: {
    name: "Goerli",
    symbol: "GÖETH",
    decimals: 18
  },
  rpcUrls: ["https://goerli.infura.io/v3/6b9f3a5d3d5e4c8e9b5d1f0c3e5f1e4a"],
  blockExplorerUrls: ["https://goerli.etherscan.io"]
}