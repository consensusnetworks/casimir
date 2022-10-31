import { ProviderString } from '@/types/ProviderString'
import { LoginCredentials } from '@casimir/types'
import { reactive } from 'vue'

export default function useAuth() {
    const usersAccounts = reactive<any>({})

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

    function addAccount(provider: ProviderString, address: string) {
        address = address.toLowerCase()
        const localStorage = window.localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts') as string) || {}

        for (const existingProvider in accounts) {
            if (accounts[existingProvider].includes(address) && existingProvider !== provider) {
                accounts[existingProvider] = accounts[existingProvider].filter((existingAddress: string) => existingAddress !== address)
            }
        }

        if (!accounts[provider] && address) {
            accounts[provider] = [address]
        } else if (address) {
            if (!accounts[provider].includes(address)) {
                accounts[provider].push(address)
            }
        }

        for (const provider in accounts) {
            usersAccounts[provider] = accounts[provider]
        }

        localStorage.setItem('accounts', JSON.stringify(accounts))
    }

    function removeAccount(provider: ProviderString, address: string) {
        address = address.toLowerCase()
        const localStorage = window.localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts') as string) || {}
        
        if (accounts[provider] && address) {
            accounts[provider] = accounts[provider].filter((account: string) => account !== address)
        }

        for (const provider in accounts) {
            usersAccounts[provider] = accounts[provider]
        }
        localStorage.setItem('accounts', JSON.stringify(accounts))
    }

    return {
        login,
        addAccount,
        removeAccount,
        usersAccounts
    }
}