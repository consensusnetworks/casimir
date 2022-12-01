import { ethers } from 'ethers'
import { LoginCredentials } from '@casimir/types'
import useUsers from './users'
const { getMessage } = useUsers()

export default function useEthers() {

    /**
     * Verifies a user's login attempt with an address, message and signed message
     * 
     * @param {LoginCredentials} loginCredentials - The user's address, message and signed message 
     * @returns {boolean} - The response from the login request
     */
    function verifyMessage(loginCredentials: LoginCredentials): boolean {
        const { address, message, signedMessage } = loginCredentials
        const existingMessage = getMessage(address)
        if (existingMessage !== message) {
            console.log(`Message mismatch: ${existingMessage} !== ${message}`)
            return false // TODO: do we want to throw a specific error here to handle better? Would have to change type.
        }
        try {
            if (!address.length || !message.length || !signedMessage.length) {
                return false
            } else {
                const recoveredAddress = ethers.utils.verifyMessage(message, signedMessage)
                return address.toLowerCase() === recoveredAddress.toLowerCase()
            }
        } catch (error) {
            console.log('error :>> ', error)
            return false
        }
    }

    return { verifyMessage }
}
