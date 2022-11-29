import { ProviderString } from '@/types/ProviderString'
import { User } from '@/interfaces/User'
import { ref } from 'vue'

export default function useUsers () {
    const usersAccounts = ref<User>({
        id: '',
        accounts: {} as Record<ProviderString, string[]>,
    })

    function updateUser ({id, accounts} : User) {
        localStorage.setItem('accounts', JSON.stringify(accounts))
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
            usersAccounts.value.accounts[provider as ProviderString] = accounts[provider]
        }
        
        // TODO: Swap in real user
        const id = 'test_user'
        updateUser({id, accounts})
    }

    function removeAccount(provider: ProviderString, address: string) {
        address = address.toLowerCase()
        const localStorage = window.localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts') as string) || {}
        
        if (accounts[provider] && address) {
            accounts[provider] = accounts[provider].filter((account: string) => account !== address)
        }

        for (const provider in accounts) {
            usersAccounts.value.accounts[provider as ProviderString] = accounts[provider]
        }

        // TODO: Swap in real user
        const id = 'test_user'
        updateUser({id, accounts})
    }

    // TODO: Duplicate function (see useAuth)
    function _getAuthBaseUrl(): string {
        if (import.meta.env.PUBLIC_MOCK) {
            return `http://localhost:${import.meta.env.PUBLIC_AUTH_PORT}`
        } else {
            return `https://auth.${import.meta.env.PUBLIC_STAGE || 'dev'}.casimir.co`
        }
    }
    
    async function getMessage(address: string) {
        const authBaseUrl = _getAuthBaseUrl()
        const response = await fetch(`${authBaseUrl}/auth/${address}`)
        const json = await response.json()
        const { message } = json
        console.log('message :>> ', message)
        return message
    }

    async function updateMessage(message: string) {
        const address = '0xd557a5745d4560b24d36a68b52351fff9c86a212'
        const authBaseUrl = _getAuthBaseUrl()
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({message})
        }
        const response = await fetch(`${authBaseUrl}/auth/${address}`, requestOptions)
        const json = await response.json()
        console.log('json :>> ', json)
        return json
    }

    return {
        usersAccounts,
        addAccount,
        removeAccount,
        getMessage,
        updateMessage
    }
}