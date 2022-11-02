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

    return {
        usersAccounts,
        addAccount,
        removeAccount
    }
}