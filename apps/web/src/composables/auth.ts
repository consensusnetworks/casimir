import useEnvironment from '@/composables/environment'
import { LoginCredentials, ProviderString } from '@casimir/types'

const { usersBaseURL } = useEnvironment()

export default function useAuth() {
    /**
     * Gets a message from the server to sign
     * 
     * @param {ProviderString} provider - The provider the user is using to sign in
     * @param {string} address - The user's address
     * @returns {Promise<Response>} - The response from the message request
     */ 
    async function getMessage(provider: ProviderString, address: string) {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        }
        return await fetch(`${usersBaseURL}/auth/message/${provider}/${address}`, requestOptions)
    }

    /**
     * Signs user up if they don't exist, otherwise
     * logs the user in with an address, message, and signed message
     * 
     * @param {LoginCredentials} loginCredentials - The user's address, provider, currency, message, and signed message 
     * @returns {Promise<Response>} - The response from the login request
     */
    async function login(loginCredentials: LoginCredentials) {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginCredentials)
        }
        return await fetch(`${usersBaseURL}/auth/login`, requestOptions)
    }

    return {
        login,
        getMessage
    }
}