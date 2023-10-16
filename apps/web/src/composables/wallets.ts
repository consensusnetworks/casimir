import { ref, readonly } from "vue"
import { ProviderString } from "@casimir/types"

const installedWallets = ref([] as ProviderString[])

export default function useWallets() {
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
      } else if(ethereum.providerMap) { // This will not show Trust Wallet even if it is installed
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
  return {
    installedWallets: readonly(installedWallets),
    detectInstalledWalletProviders
  }
}