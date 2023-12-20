import { ref, readonly } from "vue"
import { ProviderString } from "@casimir/types"
import useEthers from "@/composables/ethers"
import useWalletConnect from "@/composables/walletConnect"

const installedWallets = ref([] as ProviderString[])
const { browserProvidersList, detectActiveEthersWalletAddress, getBrowserProvider } = useEthers()
const { connectWalletConnect, web3Provider } = useWalletConnect()

export default function useWallets() {
    async function detectActiveNetwork(providerString: ProviderString): Promise<number> {
        try {
            if (browserProvidersList.includes(providerString)) {
                const provider = getBrowserProvider(providerString)
                const chainId = parseInt(await provider.request({ method: "eth_chainId" }), 16)
                return chainId
            } else if (providerString === "WalletConnect") {
                if (!web3Provider.value) {
                    await connectWalletConnect("5")
                }
                return web3Provider.value.provider.chainId
            } else if (providerString === "Ledger") {
                // TODO: Determine if there is a way to implement with Ledger or if have to rely on selected network on device
                return await new Promise(resolve => resolve(5))
            } else if (providerString === "Trezor") {
                // TODO: Determine if there is a way to implement with Ledger or if have to rely on selected network on device
                return await new Promise(resolve => resolve(5))
            } else {
                return await new Promise(resolve => resolve(0))
            }
        } catch (err) {
            console.log("Error in detectActiveNetwork: ", err)
            return await new Promise(resolve => resolve(0))
        }
    }

    async function detectActiveWalletAddress(providerString: ProviderString) {
        if (browserProvidersList.includes(providerString)) {
            return await detectActiveEthersWalletAddress(providerString)
        } else {
            alert(
                "detectActiveWalletAddress not yet implemented for this wallet provider"
            )
        }
    }
      
    
    async function detectInstalledWalletProviders() {
        const ethereum = (window as any).ethereum
        if (ethereum) {
            // MetaMask, CoinbaseWallet, TrustWallet
            if (ethereum.providers) {
                // Iterate over ethereum.providers and check if MetaMask, CoinbaseWallet, TrustWallet
                for (const provider of ethereum.providers) {
                    // Check if MetaMask
                    if (provider.isMetaMask) installedWallets.value.push("MetaMask")
                    // Check if CoinbaseWallet
                    if (provider.isCoinbaseWallet) installedWallets.value.push("CoinbaseWallet")
                    // Check if TrustWallet
                    if (provider.isTrust) installedWallets.value.push("TrustWallet")
                }
            } else if (ethereum.providerMap) { // This will not show Trust Wallet even if it is installed
                // MetaMask & CoinbaseWallet
                // Check if MetaMask
                const isMetaMask = ethereum.providerMap.has("MetaMask")
                if (isMetaMask) installedWallets.value.push("MetaMask")
                // Check if CoinbaseWallet
                const isCoinbaseWallet = ethereum.providerMap.has("CoinbaseWallet")
                if (isCoinbaseWallet) installedWallets.value.push("CoinbaseWallet")
            } else if (ethereum.isMetaMask) installedWallets.value.push("MetaMask") // Just MetaMask
            else if (ethereum.isCoinbaseWallet) installedWallets.value.push("CoinbaseWallet") // Just CoinbaseWallet
            else if (ethereum.isTrust) installedWallets.value.push("TrustWallet") // Just TrustWallet
            // console.log('installedWallets.value :>> ', installedWallets.value)
        } else {
            console.log("No ethereum browser provider found")
        }
    }

    async function switchEthersNetwork (providerString: ProviderString, chainId: string) {
        const provider = getBrowserProvider(providerString)
        try {
            await provider.request({
                method:"wallet_switchEthereumChain",
                params: [{ chainId }]
            })
        } catch (err: any) {
            console.log(`Error occurred while switching chain to chainId ${chainId}, err: ${err.message} code: ${err.code}`)
            // if (err.code === 4902){
            //     if (chainId === '5') {
            //         addEthersNetwork(providerString, goerliNetwork)
            //     } else if (chainId === '0x1252') {
            //         addEthersNetwork(providerString, iotexNetwork)
            //     }
            // }
        }
    }


    return {
        installedWallets: readonly(installedWallets),
        detectActiveNetwork,
        detectActiveWalletAddress,
        detectInstalledWalletProviders,
        switchEthersNetwork
    }
}

// async function addEthersNetwork (providerString: ProviderString, network: any) {
//     const provider = getBrowserProvider(providerString)
//     try {
//       await provider.request({
//         method: 'wallet_addEthereumChain',
//         params: [network]
//       })
//     } catch(error: any) {
//       console.log(`Error occurred while adding network ${network.chainName}, Message: ${error.message} Code: ${error.code}`)
//     }
//   }