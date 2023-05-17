import { ethers } from 'ethers'
import { LoginCredentials } from '@casimir/types'
import { EthersProvider } from '@/interfaces'
import useAuth from '@/composables/auth'
import useEthers from '@/composables/ethers'

const { createSiweMessage, signInWithEthereum } = useAuth()
const { getEthersBalance } = useEthers()

export default function useBraveWallet() {

    function detectBraveWalletAndGetProvider() {
        const { ethereum } = window
        if (ethereum?.isBraveWallet) {
            return ethereum
        } else {
            window.open('https://brave.com/download/', '_blank')
        }
    }

    async function getAddress() : Promise<string | undefined> {
        try {
            await window.ethereum.enable()
            const selectedAddress = window.ethereum.selectedAddress
            return selectedAddress
        } catch (err) {
            console.log('Error connecting to Brave Wallet:', err)
        }
    }
    
    async function getBraveAddressWithBalance() {
        const braveWalletProvider = detectBraveWalletAndGetProvider()
        if (braveWalletProvider) {
            const address = await getAddress()
            const balance = await getEthersBalance(address as string)
            return [{ address, balance }]
        }
    }

    async function loginWithBraveWallet(loginCredentials: LoginCredentials) {
    const { provider, address, currency } = loginCredentials
    const trustWalletProvider = detectBraveWalletAndGetProvider()
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
        getBraveAddressWithBalance,
        loginWithBraveWallet
    }
}