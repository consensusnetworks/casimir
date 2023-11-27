import { ethers } from "ethers"
import { SignInWithEthereumCredentials } from "@casimir/types"

export default function useEthers() {

    /**
     * Generate nonce using EIP-4361 (Sign in with Ethereum)
     * 
     * @returns {string} - The nonce
     * @see https://eips.ethereum.org/EIPS/eip-4361
     */
    function generateNonce(length = 16): string {
        let result = ""
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        return result
    }

    /**
     * Verifies a user's login attempt with an address, message and signed message
     * 
     * @param {SignInWithEthereumCredentials} SignInWithEthereumCredentials - The user's address, message and signed message 
     * @returns {boolean} - The response from the login request
     */
    function verifyMessageSignature(SignInWithEthereumCredentials: SignInWithEthereumCredentials): boolean {
        const { address, message, signedMessage } = SignInWithEthereumCredentials
        try {
            if (!address.length || !message.length || !signedMessage.length) {
                return false
            } else {
                const recoveredAddress = ethers.utils.verifyMessage(message, signedMessage)
                return address.toLowerCase() === recoveredAddress.toLowerCase()
            }
        } catch (error) {
            console.log("error :>> ", error)
            return false
        }
    }

    return { generateNonce, verifyMessageSignature }
}
