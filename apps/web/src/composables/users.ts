import { ref, readonly } from 'vue'
import { Account, AddAccountOptions, ProviderString, RemoveAccountOptions, UserWithAccountsAndOperators, ApiResponse, UserAnalyticsData } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import * as Session from 'supertokens-web-js/recipe/session'
import useTxData from '../mockData/mock_transaction_data'

const { txData } = useTxData()
const { usersUrl } = useEnvironment()

// 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const session = ref<boolean>(false)
const user = ref<UserWithAccountsAndOperators | undefined>(undefined)
const userAnalytics = ref<UserAnalyticsData>({
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

export default function useUsers() {
    async function addAccount(account: AddAccountOptions): Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ account, id: user?.value?.id })
            }
            const response = await fetch(`${usersUrl}/user/add-sub-account`, requestOptions)
            const { error, message, data: updatedUser } = await response.json()
            setUser(updatedUser)
            return { error, message, data: updatedUser }
        } catch (error: any) {
            throw new Error(error.message || 'Error adding account')
        }
    }

    async function addOperator({ address, nodeUrl }: { address: string, nodeUrl: string }) {
        try {
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address, nodeUrl })
            }
            const response = await fetch(`${usersUrl}/user/add-operator`, requestOptions)
            const { error, message } = await response.json()
            return { error, message }
        } catch (error: any) {
            throw new Error(error.message || 'Error adding operator')
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
            const response = await fetch(`${usersUrl}/user/check-if-primary-address-exists/${provider}/${address}`, requestOptions)
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
            const response = await fetch(`${usersUrl}/user/check-secondary-address/${address}`, requestOptions)
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

    function computeUserAnalytics() {
        // const result = userAnalytics.value
        console.log('rawUserAnalytics in computeAnalytics :>> ', rawUserAnalytics)
        const sortedTransactions = rawUserAnalytics.value.sort((a: any, b: any) => {
            new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
        })

        let earliest: any = null
        const latest: any = new Date().getTime()
        const oneYear = new Date().getTime() - 31536000000
        const sixMonths = new Date().getTime() - 15768000000
        const oneMonth = new Date().getTime() - 2628000000
        sortedTransactions.forEach((tx: any) => {
            const receivedAt = new Date(tx.receivedAt)
            if (!earliest) earliest = receivedAt.getTime()
            if (receivedAt.getTime() < earliest) earliest = receivedAt.getTime()
        })
        const historicalInterval = (latest - earliest) / 11

        sortedTransactions.forEach((tx: any) => {
            const { receivedAt, walletAddress, walletBalance } = tx
            /* Historical */
            let historicalDataIndex = userAnalytics.value.historical.data.findIndex((obj: any) => obj.walletAddress === walletAddress)
            if (historicalDataIndex === -1) {
                const dataLength = userAnalytics.value.historical.data.push({ walletAddress, walletBalance: Array(12).fill(0) })
                historicalDataIndex = dataLength - 1
            }
            // Determine which interval the receivedAt falls into
            const intervalIndex = Math.floor((new Date(receivedAt).getTime() - earliest) / historicalInterval)
            // Set the value of the intervalIndex to the walletBalance
            userAnalytics.value.historical.data[historicalDataIndex].walletBalance[intervalIndex] = walletBalance

            /* One Year */
            if (new Date(receivedAt).getTime() > oneYear) {
                let oneYearDataIndex = userAnalytics.value.oneYear.data.findIndex((obj: any) => obj.walletAddress === walletAddress)
                if (oneYearDataIndex === -1) {
                    const dataLength = userAnalytics.value.oneYear.data.push({ walletAddress, walletBalance: Array(12).fill(0) })
                    oneYearDataIndex = dataLength - 1
                }
                const monthsAgo = (new Date().getFullYear() - new Date(receivedAt).getFullYear()) * 12 + (new Date().getMonth() - new Date(receivedAt).getMonth())
                const intervalIndex = 11 - monthsAgo
                userAnalytics.value.oneYear.data[oneYearDataIndex].walletBalance[intervalIndex] = walletBalance
            }

            /* Six Months */
            if (new Date(receivedAt).getTime() > sixMonths) {
                let sixMonthDataIndex = userAnalytics.value.sixMonth.data.findIndex((obj: any) => obj.walletAddress === walletAddress)
                if (sixMonthDataIndex === -1) {
                    const dataLength = userAnalytics.value.sixMonth.data.push({ walletAddress, walletBalance: Array(6).fill(0) })
                    sixMonthDataIndex = dataLength - 1
                }
                const monthsAgo = (new Date().getFullYear() - new Date(receivedAt).getFullYear()) * 12 + (new Date().getMonth() - new Date(receivedAt).getMonth())
                const intervalIndex = 5 - monthsAgo
                userAnalytics.value.sixMonth.data[sixMonthDataIndex].walletBalance[intervalIndex] = walletBalance
            }

            /* One Month */
            if (new Date(receivedAt).getTime() > oneMonth) {
                let oneMonthDataIndex = userAnalytics.value.oneMonth.data.findIndex((obj: any) => obj.walletAddress === walletAddress)
                if (oneMonthDataIndex === -1) {
                    const dataLength = userAnalytics.value.oneMonth.data.push({ walletAddress, walletBalance: Array(30).fill(0) })
                    oneMonthDataIndex = dataLength - 1
                }
                const daysAgo = Math.floor((new Date().getTime() - new Date(receivedAt).getTime()) / 86400000)
                const intervalIndex = 29 - daysAgo
                userAnalytics.value.oneMonth.data[oneMonthDataIndex].walletBalance[intervalIndex] = walletBalance
            }
        })

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        // Set the historical labels array to the interval labels
        let previousMonth: any = null
        userAnalytics.value.historical.labels = Array(12).fill(0).map((_, i) => {
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
        userAnalytics.value.oneYear.labels = Array(12).fill(0).map((_, i) => {
            const date = new Date (new Date().setDate(1))
            const monthIndex = new Date(date.setMonth(date.getMonth() - (11 - i)))
            return `${months[monthIndex.getMonth()]} ${monthIndex.getFullYear()}`
        })

        // Set the sixMonth labels array to the interval labels
        userAnalytics.value.sixMonth.labels = Array(6).fill(0).map((_, i) => {
            const date = new Date (new Date().setDate(1))
            const monthIndex = new Date(date.setMonth(date.getMonth() - (5 - i)))
            return `${months[monthIndex.getMonth()]} ${monthIndex.getFullYear()}`
        })

        // Set the oneMonth labels array to the interval labels
        userAnalytics.value.oneMonth.labels = []
        for (let i = 30; i > 0; i--) {
            const date = new Date().getTime() - ((i - 1) * 86400000)
            userAnalytics.value.oneMonth.labels.push(`${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`)
        }
        // userAnalytics.value = result
    }

    async function getUserAnalytics() {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            // TODO: Re-enable this when athena is ready
            const response = await fetch(`${usersUrl}/analytics`, requestOptions)
            const { error, message, data } = await response.json()
            console.log('data from analytics :>> ', data)
            // const error = false
            // const message = 'User analytics found'

            // TODO: Get events, actions, and contract data from the API
            // Then format the data to be used in the charts (see computeUserAnalytics) and give to Steve.

            // We get the user's analytics (wallet balance) data here.
            // const data = txData.value

            if (error) throw new Error(message)

            // TODO: Pass data from above when the API / data is ready
            setRawAnalytics(data)

            // This compute's the user's wallet balance over time
            computeUserAnalytics()
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error getting user analytics')
        }
    }

    async function getMessage(address: string) {
        const response = await fetch(`${usersUrl}/auth/${address}`)
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
            const response = await fetch(`${usersUrl}/user`, requestOptions)
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
        const response = await fetch(`${usersUrl}/user/remove-sub-account`, requestOptions)
        const { data: userAccount } = await response.json()
        user.value = userAccount
        return { error: false, message: `Account removed from user: ${userAccount}`, data: userAccount }
    }

    function setUser(newUser?: UserWithAccountsAndOperators) {
        user.value = newUser as UserWithAccountsAndOperators
        userAddresses.value = newUser?.accounts.map(account => account.address) as Array<string>
    }

    function setUserAnalytics(data?: UserAnalyticsData) {
        if (user.value?.id) {
            userAnalytics.value = data as UserAnalyticsData
        } else {
            const userAnalyticsInit = {
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
            }
            userAnalytics.value = userAnalyticsInit
        }
    }

    function setRawAnalytics(data: UserAnalyticsData) {
        rawUserAnalytics.value = data
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

            // TODO: Should be setting the wallet table balances here as well
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
        return await fetch(`${usersUrl}/user/update-primary-account`, requestOptions)
    }

    async function updateUserAgreement(agreed: boolean) {
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agreed })
        }
        return await fetch(`${usersUrl}/user/update-user-agreement/${user.value?.id}`, requestOptions)
    }

    return {
        session,
        user: readonly(user),
        userAddresses,
        userAnalytics,
        rawUserAnalytics,
        addAccount,
        addOperator,
        checkIfSecondaryAddress,
        checkIfPrimaryUserExists,
        checkUserSessionExists,
        getMessage,
        getUser,
        getUserAnalytics,
        removeAccount,
        setUser,
        setUserAccountBalances,
        setUserAnalytics,
        updatePrimaryAddress,
        updateUserAgreement
    }
}