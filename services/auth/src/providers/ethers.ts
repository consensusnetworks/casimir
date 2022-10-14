// import ethers from 'ethers'
import { LoginCredentials } from '@casimir/types'

export default function useEthers() {

    /**
     * Verifies a user's login attempt with an address, message and signed message
     * 
     * @param {LoginCredentials} loginCredentials - The user's address, message and signed message 
     * @returns {boolean} - The response from the login request
     */
    function verifyMessage(loginCredentials: LoginCredentials): boolean {
        console.log('Login credentials', loginCredentials)
        // @ccali11 create address recovery verification here
        return false
    }

    return { verifyMessage }
}
