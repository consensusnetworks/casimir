import { ref, onMounted, readonly, watch } from 'vue'
import { AddAccountOptions, ProviderString, RemoveAccountOptions, UserWithAccounts, ApiResponse } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import * as Session from 'supertokens-web-js/recipe/session'
import txData from '../mockData/mock_transaction_data.json'

const { usersBaseURL } = useEnvironment()

// 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const initialized = ref<boolean>(false)
const session = ref<boolean>(false)
const user = ref<UserWithAccounts | null>(null)
const userAnalytics = ref<any>({
    oneMonth: {
        labels: [],
        data: []
    },
    sixMonth: {
        labels: [],
        data: []
    },
    oneYear: {
        labels: [],
        data: []
    },
    historical: {
        labels: [],
        data: []
    }
})
const rawUserAnalytics = ref<any>(null)
const userAddresses = ref<Array<string>>([])

export default function useUsers () {


    async function addAccount(account: AddAccountOptions): Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ account })
            }
            const response = await fetch(`${usersBaseURL}/user/add-sub-account`, requestOptions)
            const { error, message, data: user } = await response.json()
            setUser(user)
            return { error, message, data: user }
        } catch (error: any) {
            throw new Error(error.message || 'Error adding account')
        }
    }

    async function checkIfPrimaryUserExists(provider: ProviderString, address: string): Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersBaseURL}/user/check-if-primary-address-exists/${provider}/${address}`, requestOptions)
            const { error, message, data } = await response.json()
            if (error) throw new Error(message)
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error checking if primary user exists')
        }
    }

    async function checkIfSecondaryAddress(address: string) : Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersBaseURL}/user/check-secondary-address/${address}`, requestOptions)
            const { error, message, data } = await response.json()
            if (error) throw new Error(message)
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error checking if secondary address')
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
                const { data: user } = await getUser()
                if (user) {
                    setUser(user)
                    return true
                } else {
                    return false
                }
            }
            return false
        } catch (error: any) {
            console.log('Error in checkUserSessionExists in wallet.ts :>> ', error)
            return false
        }
    }

    async function setUserAnalytics() {
        rawUserAnalytics.value = txData
        setData('historical')
    }

    function setData(timeline: 'oneMonth' | 'sixMonth' | 'oneYear' | 'historical') {
        const result = userAnalytics.value
        const sortedTransactions = rawUserAnalytics.value.sort((a: any, b: any) => {
            new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
        })

        let earliest: any = null
        let latest: any = null

        sortedTransactions.forEach((tx: any) => {
            const receivedAt = new Date(tx.receivedAt)
            if (!earliest) earliest = receivedAt.getTime()
            if (!latest) latest = receivedAt.getTime()
            if (receivedAt.getTime() < earliest) earliest = receivedAt.getTime()
            if (receivedAt.getTime() > latest) latest = receivedAt.getTime()
        })

        const interval = (latest - earliest) / 12

        sortedTransactions.forEach((tx: any) => {
            const { receivedAt, walletAddress, walletBalance } = tx
            // If historical data array does not have an object with the walletAddress, add it
            if (!result.historical.data.find((obj: any) => obj.walletAddress === walletAddress)) {
                result.historical.data.push({ walletAddress, walletBalance: Array(12).fill(0) })
                // Determine which interval the receivedAt falls into
                const intervalIndex = Math.floor((new Date(receivedAt).getTime() - earliest) / interval)
                // Set the value of the intervalIndex to the walletBalance
                result.historical.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
            } else {
                // Determine which interval the receivedAt falls into
                const intervalIndex = Math.floor((new Date(receivedAt).getTime() - earliest) / interval)
                // Set the value of the intervalIndex to the walletBalance
                result.historical.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
            }
        })

        // Set the historical labels array to the interval labels
        result.historical.labels = Array(12).fill(0).map((_, i) => {
            const date = new Date(earliest + (interval * i))
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        })
        userAnalytics.value = result
    }

    async function getUserAnalytics() {
        console.log('got to user analytics')
        try {
            const userId = user.value?.id
            const requestOptions = {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json'
                }
            }
            // TODO: Uncomment this when the API / data is ready
            // const response = await fetch(`${usersBaseURL}/analytics/${userId}`, requestOptions)
            // const { error, message, data } = await response.json()
            // if (error) throw new Error(message)
            // rawUserAnalytics.value = data
            setUserAnalytics()
            // return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error getting user analytics')
        }
    }

    async function getMessage(address: string) {
        const response = await fetch(`${usersBaseURL}/auth/${address}`)
        const json = await response.json()
        const { message } = json
        return message
    }

    async function getUser() : Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersBaseURL}/user`, requestOptions)
            const { user, error, message } = await response.json()
            return {
                error,
                message,
                data: user
            }
        } catch (error: any) {
            throw new Error('Error getting user from API route')
        }
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
        user.value = newUser as UserWithAccounts
        userAddresses.value = newUser?.accounts.map(account => account.address) as Array<string>
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

    watch(user, async () => {
        if (user.value?.id) await getUserAnalytics()
    })

    onMounted(async () => {
        if (!initialized.value && user.value?.id) {
            await getUserAnalytics()
            initialized.value = true
        }
    })

    return {
        session,
        user: readonly(user),
        userAddresses,
        userAnalytics,
        addAccount,
        checkIfSecondaryAddress,
        checkIfPrimaryUserExists,
        checkUserSessionExists,
        getMessage,
        getUser,
        getUserAnalytics,
        removeAccount,
        setUser,
        updatePrimaryAddress
    }
}