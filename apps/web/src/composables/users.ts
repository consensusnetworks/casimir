import { ref } from 'vue'
import { AddAccountOptions, ProviderString, RemoveAccountOptions, UserWithAccounts, Account, ExistingUserCheck } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import * as Session from 'supertokens-web-js/recipe/session'

const { usersBaseURL } = useEnvironment()

// 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const session = ref<boolean>(false)
const user = ref<UserWithAccounts>()

export default function useUsers () {

    async function addAccount(account: AddAccountOptions): Promise<{ error: boolean, message: string, data: UserWithAccounts | null }> {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account })
        }
        const response = await fetch(`${usersBaseURL}/user/add-sub-account`, requestOptions)
        const { data: userAccount } = await response.json()
        user.value = userAccount
        return { error: false, message: `Account added to user: ${userAccount}`, data: userAccount }
    }

    async function checkIfPrimaryUserExists(provider: ProviderString, address: string): Promise<ExistingUserCheck> {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            },
        }
        const response = await fetch(`${usersBaseURL}/auth/check-if-primary-address-exists/${provider}/${address}`, requestOptions)
        const { sameAddress, sameProvider } = await response.json()
        return { sameAddress, sameProvider }
    }

    async function checkIfSecondaryAddress(address: string) : Promise<Account[]> {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersBaseURL}/auth/check-secondary-address/${address}`, requestOptions)
            const json = await response.json()
            const { users } = json
            return users
        } catch (error) {
            console.log('Error in checkIfSecondaryAddress in wallet.ts :>> ', error)
            return [] as Account[]
        }
    }

    /**
     * Checks if session exists and, if so: 
     * Gets the user's account via the API
     * Sets the user's account locally
    */
    async function checkUserSessionExists() : Promise<boolean> {
        try {
            session.value = await Session.doesSessionExist()
            if (session.value) {
                const user = await getUser()
                if (user) {
                    setUser(user)
                    return true
                } else {
                    return false
                }
            }
            return false
        } catch (error) {
            console.log('Error in checkUserSessionExists in wallet.ts :>> ', error)
            return false
        }
    }

    async function getMessage(address: string) {
        const response = await fetch(`${usersBaseURL}/auth/${address}`)
        const json = await response.json()
        const { message } = json
        return message
    }

    async function getUser() {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        }
        const response = await fetch(`${usersBaseURL}/user`, requestOptions)
        const { user } = await response.json()
        return user
    }

    async function removeAccount({ address, currency, ownerAddress, walletProvider }: RemoveAccountOptions) {
        address = address.toLowerCase()
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address,
                currency,
                ownerAddress,
                walletProvider,
            })
        }
        const response = await fetch(`${usersBaseURL}/user/remove-sub-account`, requestOptions)
        const { data: userAccount } = await response.json()
        user.value = userAccount
        return { error: false, message: `Account removed from user: ${userAccount}`, data: userAccount }
    }

    function setUser(newUser?: UserWithAccounts) {
        user.value = newUser
    }

    async function updatePrimaryAddress(updatedAddress: string) {
        const userId = user?.value?.id
        const requestOptions = {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, updatedAddress })
        }
        return await fetch(`${usersBaseURL}/user/update-primary-account`, requestOptions)
    }

    return {
        session,
        user,
        addAccount,
        checkIfSecondaryAddress,
        checkIfPrimaryUserExists,
        checkUserSessionExists,
        getMessage,
        getUser,
        removeAccount,
        setUser,
        updatePrimaryAddress
    }
}