import { LoginCredentials } from '@casimir/types'
import useEnvironment from '@/composables/environment'

const { _getAuthBaseUrl } = useEnvironment()

export default function useAuth() {
    async function getMessage(address: string) {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        }
        const authBaseUrl = _getAuthBaseUrl()
        return await fetch(`${authBaseUrl}/auth/${address}`, requestOptions)
    }
    /**
     * Logs a user in with an address, message and signed message
     * 
     * @param {LoginCredentials} loginCredentials - The user's address, message and signed message 
     * @returns {Promise<Response>} - The response from the login request
     */
    async function login(loginCredentials: LoginCredentials): Promise<Response> {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginCredentials)
        }
        const authBaseUrl = _getAuthBaseUrl()
        return await fetch(`${authBaseUrl}/login`, requestOptions)
    }

    return {
        login,
        getMessage
    }
}