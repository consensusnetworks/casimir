import { readonly, ref, watchEffect } from 'vue'
import { UserAnalyticsData } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import useTxData from '../mockData/mock_transaction_data'

const { usersUrl } = useEnvironment()
const { mockData, txData } = useTxData()

export default function useAnalytics() {
    const finishedComputingUerAnalytics = ref(false)
    const getUserAnalyticsError = ref(null)
    const rawUserAnalytics = ref<any>(null)
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

    function computeUserAnalytics() {
        finishedComputingUerAnalytics.value = false
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
        finishedComputingUerAnalytics.value = true
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
            const { error, message, data: athenaData } = await response.json()
            // console.log('data from analytics :>> ', data)
            // userAnalytics.value = athenaData
            getUserAnalyticsError.value = error
            if (error) throw new Error(`Error in getUserAnalytics: ${message}`)

            // TODO: Get events, actions, and contract data from the API
            // Then format the data to be used in the charts (see computeUserAnalytics) and give to Steve.

            // We get the user's analytics (wallet balance) data here.
            mockData()
            console.log('txData.value :>> ', txData.value)
            const data = txData.value

            // TODO: Pass data from above when the API / data is ready
            rawUserAnalytics.value = data

            // This compute's the user's wallet balance over time
            computeUserAnalytics()
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error getting user analytics')
        }
    }

    async function updateAnalytics() {
        await getUserAnalytics()
    }

    watchEffect(async () => {
        resetUserAnalytics()
        await getUserAnalytics()
    })

    function resetUserAnalytics() {
        getUserAnalyticsError.value = null
        userAnalytics.value = {
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
    }

    return { 
        finishedComputingUerAnalytics: readonly(finishedComputingUerAnalytics),
        userAnalytics: readonly(userAnalytics),
        getUserAnalyticsError: readonly(getUserAnalyticsError),
        updateAnalytics,
        rawUserAnalytics,
    }
}