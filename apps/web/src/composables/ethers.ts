import { ethers } from "ethers"
import { CryptoAddress, EthersProvider } from "@casimir/types"
import { LoginCredentials, ProviderString } from "@casimir/types"
import useEnvironment from "@/composables/environment"
import useSiwe from "@/composables/siwe"
import useWallets from "@/composables/wallets"

interface ethereumWindow extends Window {
  ethereum: any;
}
declare const window: ethereumWindow

const { provider, batchProvider } = useEnvironment()
const { createSiweMessage, signInWithEthereum } = useSiwe()
const { installedWallets } = useWallets()


export default function useEthers() {
  
    const browserProvidersList = [
        "BraveWallet",
        "CoinbaseWallet",
        "MetaMask",
        "OkxWallet",
        "TrustWallet"
    ]

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
        } catch (err) {
            console.error("There was an error in detectActiveEthersWalletAddress :>> ", err)
            return ""
        }
    }

    function getBrowserProvider(providerString: ProviderString) {
        try {
            const { ethereum } = window
            const isInstalled = installedWallets.value.includes(providerString)
            if (providerString === "CoinbaseWallet") {
                if (!ethereum.providerMap && isInstalled) return alert("TrustWallet or another wallet may be interfering with CoinbaseWallet. Please disable other wallets and try again.")
                if (ethereum?.providerMap) return ethereum.providerMap.get(providerString)
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
        } catch (err) {
            console.error("There was an error in getBrowserProvider :>> ", err)
        }
    }

    async function getEthersAddressesWithBalances(providerString: ProviderString): Promise<CryptoAddress[]> {
        const provider = getBrowserProvider(providerString)
        if (provider) {
            const addresses = await provider.request({ method: "eth_requestAccounts" })
            const balancePromises = addresses.map((address: string) => batchProvider.getBalance(address))
            const balances = await Promise.all(balancePromises)
            const addressesWithBalance = addresses.map((address: string, index: number) => ({
                address: address,
                balance: ethers.utils.formatEther(balances[index])
            }))
    
            return addressesWithBalance
        } else {
            throw new Error("Provider not yet connected to this dapp. Please connect and try again.")
        }
    }
    
    async function getEthersBalance(address: string) : Promise<GLfloat> {
        const balance = await provider.getBalance(address)
        return parseFloat(ethers.utils.formatEther(balance))
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

    async function loginWithEthers(loginCredentials: LoginCredentials): Promise<void> {
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

    return { 
        browserProvidersList,
        detectActiveEthersWalletAddress,
        getBrowserProvider,
        getEthersAddressesWithBalances,
        getEthersBalance,
        getEthersBrowserSigner,
        getGasPriceAndLimit,
        loginWithEthers,
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
    } else {
        window.open("https://trustwallet.com/download", "_blank")
    }
}