import { ethers } from 'ethers'
import { LoginCredentials } from '@casimir/types'

export default function useEthers() {

    /**
     * Verifies a user's login attempt with an address, message and signed message
     * 
     * @param {LoginCredentials} loginCredentials - The user's address, message and signed message 
     * @returns {boolean} - The response from the login request
     */
    function verifyMessage(loginCredentials: LoginCredentials): boolean {
        const { address, message, signedMessage } = loginCredentials
        try {
            if (!address.length || !message.length || !signedMessage.length) {
                return false
            } else {
                const recoveredAddress = ethers.utils.verifyMessage(message, signedMessage)
                return recoveredAddress === address
            }
        } catch (error) {
            console.log('error :>> ', error)
            return false
        }
    }

    return { verifyMessage }
}
