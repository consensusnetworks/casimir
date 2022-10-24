import { LoginCredentials } from '@casimir/types'

export default function useAuth() {

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

    /**
     * Get the auth base url for the current environment
     * 
     * @returns {string} The base URL for the auth API
     */
    function _getAuthBaseUrl(): string {
        if (import.meta.env.PUBLIC_MOCK) {
            return `http://localhost:${import.meta.env.PUBLIC_AUTH_PORT}`
        } else {
            return `https://auth.${import.meta.env.PUBLIC_STAGE || 'dev'}.casimir.co`
        }
    }

    function saveAccount(provider: string, address: string) {
        const localStorage = window.localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts') as string) || {}
        
        if (!accounts[provider] && address) {
            accounts[provider] = [address]
        } else if (address) {
            if (!accounts[provider].includes(address)) {
                accounts[provider].push(address)
            }
        }

        localStorage.setItem('accounts', JSON.stringify(accounts))
        console.log('accounts in localStorage :>> ', localStorage.accounts)
    }

    function removeAccount(address: string) {
        window.localStorage.removeItem('address')
    }

    return {
        login,
        saveAccount,
        removeAccount
    }
}