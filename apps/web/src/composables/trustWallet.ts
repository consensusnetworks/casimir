import { ethers } from 'ethers'
import { LoginCredentials } from '@casimir/types'
import { EthersProvider } from '@/interfaces'
import useAuth from '@/composables/auth'
import useEthers from '@/composables/ethers'

const { createSiweMessage, signInWithEthereum } = useAuth()
const { getEthersBalance, requestEthersAccount } = useEthers()

export default function useTrustWallet() {

    function detectTrustWalletAndGetProvider() {
        const { ethereum } = window
        const providers = ethereum?.providers
        if (providers) {
          for (const provider of providers) {
            if (provider.isTrustWallet) return provider
          }
        }
    }
    
    async function getTrustWalletAddressWithBalance() {
        const trustWalletProvider = detectTrustWalletAndGetProvider()
        if (trustWalletProvider) {
            const address = (await requestEthersAccount(trustWalletProvider))[0]
            const balance = await getEthersBalance(address)
            return [{ address, balance }]
        }
    }

    async function loginWithTrustWallet(loginCredentials: LoginCredentials) {
    const { provider, address, currency } = loginCredentials
    const trustWalletProvider = detectTrustWalletAndGetProvider()
    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(trustWalletProvider as EthersProvider)
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
    } catch(err) {
        console.log('Error logging in: ', err)
        return err
    }
    }

    return {
        getTrustWalletAddressWithBalance,
        loginWithTrustWallet
    }
}