import { ref, readonly, onMounted, watch } from 'vue'
import { Account, AddAccountOptions, ProviderString, RemoveAccountOptions, UserWithAccounts, ApiResponse } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import useEthers from './ethers'
import * as Session from 'supertokens-web-js/recipe/session'
import txData from '../mockData/mock_transaction_data.json'

const { usersBaseURL } = useEnvironment()

// 0xd557a5745d4560B24D36A68b52351ffF9c86A212
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
                body: JSON.stringify({ account, id: user?.value?.id })
            }
            const response = await fetch(`${usersBaseURL}/user/add-sub-account`, requestOptions)
            const { error, message, data: updatedUser } = await response.json()
            setUser(updatedUser)
            return { error, message, data: updatedUser }
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

    async function getAccountBalance(account: Account) {
        const { getEthersBalance } = useEthers()
        try {
            return await getEthersBalance(account.address)
        } catch (err: any) {
            throw new Error(err.message || 'There was an error getting the account balance')
        }
    }

    function setUserAnalytics() {
        const result = userAnalytics.value
        const sortedTransactions = rawUserAnalytics.value.sort((a: any, b: any) => {
            new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
        })

        let earliest: any = null
        const latest: any = new Date().getTime()
        const oneYear = new Date().getTime() - 31536000000
        const oneYearInterval = (latest - oneYear) / 11
        const sixMonths = new Date().getTime() - 15768000000
        const sixMonthInterval = (latest - sixMonths) / 5
        const oneMonth = new Date().getTime() - 2628000000
        const oneMonthInterval = 29
        sortedTransactions.forEach((tx: any) => {
            const receivedAt = new Date(tx.receivedAt)
            if (!earliest) earliest = receivedAt.getTime()
            if (receivedAt.getTime() < earliest) earliest = receivedAt.getTime()
        })
        const historicalInterval = (latest - earliest) / 11
        
        sortedTransactions.forEach((tx: any) => {
            const { receivedAt, walletAddress, walletBalance } = tx
            /* Historical */
            if (!result.historical.data.find((obj: any) => obj.walletAddress === walletAddress)) {
                result.historical.data.push({ walletAddress, walletBalance: Array(12).fill(0) })
                // Determine which interval the receivedAt falls into
                const intervalIndex = Math.floor((new Date(receivedAt).getTime() - earliest) / historicalInterval)
                // Set the value of the intervalIndex to the walletBalance
                result.historical.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
            } else {
                // Determine which interval the receivedAt falls into
                const intervalIndex = Math.floor((new Date(receivedAt).getTime() - earliest) / historicalInterval)
                // Set the value of the intervalIndex to the walletBalance
                result.historical.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
            }

            /* One Year */
            if (new Date(receivedAt).getTime() > oneYear) {
                if (!result.oneYear.data.find((obj: any) => obj.walletAddress === walletAddress)) {
                    result.oneYear.data.push({ walletAddress, walletBalance: Array(12).fill(0) })
                    const intervalIndex = Math.floor((new Date(receivedAt).getTime() - oneYear) / oneYearInterval)
                    result.oneYear.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
                } else {
                    const intervalIndex = Math.floor((new Date(receivedAt).getTime() - oneYear) / oneYearInterval)
                    result.oneYear.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
                }
            }

            /* Six Months */
            if (new Date(receivedAt).getTime() > sixMonths) {
                if (!result.sixMonth.data.find((obj: any) => obj.walletAddress === walletAddress)) {
                    result.sixMonth.data.push({ walletAddress, walletBalance: Array(12).fill(0) })
                    const intervalIndex = Math.floor((new Date(receivedAt).getTime() - sixMonths) / sixMonthInterval)
                    result.sixMonth.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
                } else {
                    const intervalIndex = Math.floor((new Date(receivedAt).getTime() - sixMonths) / sixMonthInterval)
                    result.sixMonth.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
                }
            }

            /* One Month */
            if (new Date(receivedAt).getTime() > oneMonth) {
                if (!result.oneMonth.data.find((obj: any) => obj.walletAddress === walletAddress)) {
                    result.oneMonth.data.push({ walletAddress, walletBalance: Array(30).fill(0) })
                    const daysAgo = Math.floor((new Date().getTime() - new Date(receivedAt).getTime()) / 86400000)
                    const intervalIndex = 29 - daysAgo
                    result.oneMonth.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
                } else {
                    const daysAgo = Math.floor((new Date().getTime() - new Date(receivedAt).getTime()) / 86400000)
                    const intervalIndex = 29 - daysAgo
                    result.oneMonth.data.find((obj: any) => obj.walletAddress === walletAddress).walletBalance[intervalIndex] = walletBalance
                }
            }
        })

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        // Set the historical labels array to the interval labels
        let previousMonth: any = null
        result.historical.labels = Array(12).fill(0).map((_, i) => {
            const date = new Date(earliest + (historicalInterval * i))
            const currentMonth = date.getMonth()
            if (!previousMonth) {
                previousMonth = currentMonth
                return date.getMonth() === 0 ? `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}` : `${months[date.getMonth()]} ${date.getDate()}`
            } else if (currentMonth < previousMonth) {
                previousMonth = currentMonth
                return `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}`
            } else {
                previousMonth = currentMonth
                return `${months[date.getMonth()]} ${date.getDate()}`
            }
        })

        // Set the oneYear labels array to the interval labels
        result.oneYear.labels = Array(12).fill(0).map((_, i) => {
            const date = new Date(oneYear + (oneYearInterval * i))
            return date.getMonth() === 0 ? `${date.getFullYear()} ${months[date.getMonth()]}` : `${months[date.getMonth()]}`
        })

        // Set the sixMonth labels array to the interval labels
        result.sixMonth.labels = Array(12).fill(0).map((_, i) => {
            const date = new Date(sixMonths + (sixMonthInterval * i))
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        })

        // Set the oneMonth labels array to the interval labels
        result.oneMonth.labels = []
        for (let i = 30; i > 0; i--) {
            const date = new Date().getTime() - ((i - 1) * 86400000)
            result.oneMonth.labels.push(`${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`)
        }
        userAnalytics.value = result
    }

    async function getUserAnalytics() {
        try {
            const requestOptions = {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersBaseURL}/analytics`, requestOptions)
            const { error, message, data } = await response.json()
            if (error) throw new Error(message)
            
            // TODO: Swap this when the API / data is ready
            // rawUserAnalytics.value = data
            rawUserAnalytics.value = txData
            
            setUserAnalytics()
            return { error, message, data }
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
                id: user?.value?.id,
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

    async function setUserAccountBalances() {
        try {
          if (user?.value?.accounts) {
            const { accounts } = user.value
            const accountsWithBalances = await Promise.all(accounts.map(async (account: Account) => {
              const balance = await getAccountBalance(account)
              return {
                ...account,
                balance
              }
            }))
            
            user.value.accounts = accountsWithBalances
            setUser(user.value)
          }
        } catch (error) {
          throw new Error('Error setting user account balances')
        }
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

    async function updateUserAgreement(agreed: boolean) {
        const requestOptions = {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agreed })
        }
        return await fetch(`${usersBaseURL}/user/update-user-agreement/${user.value?.id}`, requestOptions)
    }

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
        setUserAccountBalances,
        updatePrimaryAddress,
        updateUserAgreement
    }
}