import { onMounted, onUnmounted, readonly, ref, watch } from 'vue'
import * as Session from 'supertokens-web-js/recipe/session'
import { ethers } from 'ethers'
import { Account, BreakdownAmount, BreakdownString, ContractEventsByAddress, Currency, LoginCredentials, Pool, ProviderString, RegisteredOperator, User, UserAnalyticsData, UserWithAccountsAndOperators } from '@casimir/types'
import useContracts from '@/composables/contracts'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useFormat from '@/composables/format'
import useLedger from '@/composables/ledger'
import usePrice from '@/composables/price'
import useTrezor from '@/composables/trezor'
import useWalletConnect from '@/composables/walletConnectV2'
import { Operator, Scanner } from '@casimir/ssv'

// Test address: 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const { manager, registry, views } = useContracts()
const { ethereumUrl, managerAddress, registryAddress, ssvNetworkAddress, ssvNetworkViewsAddress, usersUrl, viewsAddress } = useEnvironment()
const { ethersProviderList, loginWithEthers } = useEthers()
const { formatNumber } = useFormat()
const { loginWithLedger } = useLedger()
const { loginWithTrezor } = useTrezor()
const { getCurrentPrice } = usePrice()
const { loginWithWalletConnectV2, initializeWalletConnect, uninitializeWalletConnect } = useWalletConnect()

const initializeComposable = ref(false)
const nonregisteredOperators = ref<Operator[]>([])
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
const rawUserAnalytics = ref<any>(null)
const registeredOperators = ref<Operator[]>([])
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

const currentStaked = ref<BreakdownAmount>({
    usd: '$0.00',
    eth: '0 ETH'
})

const stakingRewards = ref<BreakdownAmount>({
    usd: '$0.00',
    eth: '0 ETH'
})

const totalWalletBalance = ref<BreakdownAmount>({
    usd: '$0.00',
    eth: '0 ETH'
})

export default function useUser() {
    async function addAccountToUser({ provider, address, currency }: { provider: string, address: string, currency: string}) {
        const userAccountExists = user.value?.accounts?.some((account: Account | any) => account?.address === address && account?.walletProvider === provider && account?.currency === currency)
        if (userAccountExists) return 'Account already exists for this user'
        const account = {
            userId: user?.value?.id,
            address: address.toLowerCase() as string,
            currency: currency || 'ETH',
            ownerAddress: user?.value?.address.toLowerCase() as string,
            walletProvider: provider
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account, id: user?.value?.id })
        }

        try {
            const response = await fetch(`${usersUrl}/user/add-sub-account`, requestOptions)
            const { error, message, data: updatedUser } = await response.json()
            if (error) throw new Error(message || 'There was an error adding the account')
            user.value = updatedUser
            await setUserAccountBalances()
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

    async function blockListener(blockNumber: number) {
        console.log('blockNumber :>> ', blockNumber)
        const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        const block = await provider.getBlockWithTransactions(blockNumber)
        
        const txs = block.transactions.map(async (tx: any) => {
            if (addresses.includes(tx.from.toLowerCase())) {
                console.log('tx :>> ', tx)
                try {
                    // const response = manager.interface.parseTransaction({ data: tx.data })
                    // console.log('response :>> ', response)
                    await refreshBreakdown()
                } catch (error) {
                    console.error('Error parsing transaction:', error)
                }
            }
        })
    
        await Promise.all(txs)
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

    async function getAllTimeStakingRewards() : Promise<BreakdownAmount> {
        try {
            /* Get User's Current Stake */
            const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
            const currentUserStakePromises = [] as Array<Promise<ethers.BigNumber>>
            addresses.forEach(address => currentUserStakePromises.push(manager.getUserStake(address)))
            const settledCurrentUserStakePromises = await Promise.allSettled(currentUserStakePromises) as Array<PromiseFulfilledResult<ethers.BigNumber>>
            const currentUserStake = settledCurrentUserStakePromises.filter(result => result.status === 'fulfilled').map(result => result.value)
            const currentUserStakeSum = currentUserStake.reduce((acc, curr) => acc.add(curr), ethers.BigNumber.from(0))
            const currentUserStakeETH = parseFloat(ethers.utils.formatEther(currentUserStakeSum))

            /* Get User's All Time Deposits and Withdrawals */
            const userEventTotalsPromises = [] as Array<Promise<ContractEventsByAddress>>
            addresses.forEach(address => {userEventTotalsPromises.push(getContractEventsTotalsByAddress(address))})
            const userEventTotals = await Promise.all(userEventTotalsPromises) as Array<ContractEventsByAddress>
            const userEventTotalsSum = userEventTotals.reduce((acc, curr) => {
                const { StakeDeposited, WithdrawalInitiated } = curr
                return {
                  StakeDeposited: acc.StakeDeposited + (StakeDeposited || 0),
                  WithdrawalInitiated: acc.WithdrawalInitiated + (WithdrawalInitiated || 0),
                }
              }, { StakeDeposited: 0, WithdrawalInitiated: 0 } as { StakeDeposited: number; WithdrawalInitiated: number })
              
              
            const stakedDepositedETH = userEventTotalsSum.StakeDeposited
            const withdrawalInitiatedETH = userEventTotalsSum.WithdrawalInitiated

            /* Get User's All Time Rewards by Subtracting (StakeDeposited + WithdrawalInitiated) from CurrentStake */
            const currentUserStakeMinusEvents = currentUserStakeETH - (stakedDepositedETH as number) - (withdrawalInitiatedETH as number)
            return {
                eth: `${formatNumber(currentUserStakeMinusEvents)} ETH`,
                usd: `$${formatNumber(currentUserStakeMinusEvents * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' })))}`
            }
        } catch (err) {
            console.error(`There was an error in getAllTimeStakingRewards: ${err}`)
            return {
                eth: '0 ETH',
                usd: '$ 0.00'
            }
        }
    }

    async function getCurrentStaked(): Promise<BreakdownAmount> {
        const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        try {
            const promises = addresses.map((address) => manager.getUserStake(address))
            const settledPromises = await Promise.allSettled(promises) as Array<PromiseFulfilledResult<ethers.BigNumber>>
            const currentStaked = settledPromises
                .filter((result) => result.status === 'fulfilled')
                .map((result) => result.value)
    
            const totalStaked = currentStaked.reduce((accumulator, currentValue) => accumulator.add(currentValue), ethers.BigNumber.from(0))
            const totalStakedUSD = parseFloat(ethers.utils.formatEther(totalStaked)) * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
            const totalStakedETH = parseFloat(ethers.utils.formatEther(totalStaked))
            const formattedTotalStakedUSD = formatNumber(totalStakedUSD)
            const formattedTotalStakedETH = formatNumber(totalStakedETH)
            return {
                eth: formattedTotalStakedETH + ' ETH',
                usd: '$ ' + formattedTotalStakedUSD
            }
        } catch (error) {
            console.log('Error occurred while fetching stake:', error)
            return {
                eth: '0ETH',
                usd: '$0.00'
            }
        }
    }

    async function getContractEventsTotalsByAddress(address: string) : Promise<ContractEventsByAddress> {
        try {
            const eventList = [
                'StakeDeposited',
                'StakeRebalanced',
                'WithdrawalInitiated'
            ]
            const eventFilters = eventList.map(event => {
                if (event === 'StakeRebalanced') return manager.filters[event]()
                return manager.filters[event](address)
            })

            // const items = (await Promise.all(eventFilters.map(async eventFilter => await manager.queryFilter(eventFilter, 0, 'latest'))))
            // Use Promise.allSettled to avoid errors when a filter returns no results
            const items = (await Promise.allSettled(eventFilters.map(async eventFilter => await manager.queryFilter(eventFilter, 0, 'latest')))).map(result => result.status === 'fulfilled' ? result.value : [])
    
            const userEventTotals = eventList.reduce((acc, event) => {
                acc[event] = 0
                return acc
            }, {} as { [key: string]: number })
    
            for (const item of items) {
                for (const action of item) {
                    const { args, event } = action
                    const { amount } = args
                    const amountInEth = parseFloat(ethers.utils.formatEther(amount))
                    userEventTotals[event as string] += amountInEth
                }
            }
    
            return userEventTotals
        } catch (err) {
            console.error(`There was an error in getContractEventsTotalsByAddress: ${err}`)
            return {
                StakeDeposited: 0,
                StakeRebalanced: 0,
                WithdrawalInitiated: 0
            }
        }
    }

    async function getEthersBalance(address: string) : Promise<GLfloat> {
        const balance = await provider.getBalance(address)
        return parseFloat(ethers.utils.formatEther(balance))
    }

    async function getTotalWalletBalance() : Promise<BreakdownAmount> {
        const promises = [] as Array<Promise<any>>
        const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        addresses.forEach((address) => { promises.push(getEthersBalance(address)) })
        const totalWalletBalance = (await Promise.all(promises)).reduce((acc, curr) => acc + curr, 0)
        const totalWalletBalanceUSD = totalWalletBalance * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
        const formattedTotalWalletBalance = formatNumber(totalWalletBalance)
        const formattedTotalWalletBalanceUSD = formatNumber(totalWalletBalanceUSD)
        return {
            eth: formattedTotalWalletBalance + ' ETH',
            usd: '$ ' + formattedTotalWalletBalanceUSD
        }
    }

    async function getUser() {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersUrl}/user`, requestOptions)
            const { user: retrievedUser, error } = await response.json()
            if (error) throw new Error(error)
            user.value = retrievedUser
        } catch (error: any) {
            throw new Error('Error getting user from API route')
        }
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
            rawUserAnalytics.value = data

            // This compute's the user's wallet balance over time
            computeUserAnalytics()
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error getting user analytics')
        }
    }

    async function getUserOperators(): Promise<void> {
        const userAddresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]

        const scanner = new Scanner({ 
            ethereumUrl,
            ssvNetworkAddress,
            ssvNetworkViewsAddress
        })

        const ssvOperators: Operator[] = []
        for (const address of userAddresses) {
            const userOperators = await scanner.getOperators(address)
            ssvOperators.push(...userOperators)
        }

        const casimirOperators: RegisteredOperator[] = []
        for (const operator of ssvOperators) {
            const { active, collateral, poolCount, resharing } = await registry.getOperator(operator.id)
            const registered = active || collateral.gt(0) || poolCount.gt(0) || resharing
            if (registered) {
                const pools = await _getPools(operator.id)
                // TODO: Replace these Public Nodes URLs once we have this working again
                const operatorStore = {
                    '654': 'https://nodes.casimir.co/eth/goerli/dkg/1',
                    '655': 'https://nodes.casimir.co/eth/goerli/dkg/2',
                    '656': 'https://nodes.casimir.co/eth/goerli/dkg/3',
                    '657': 'https://nodes.casimir.co/eth/goerli/dkg/4',
                    '658': 'https://nodes.casimir.co/eth/goerli/dkg/5',
                    '659': 'https://nodes.casimir.co/eth/goerli/dkg/6',
                    '660': 'https://nodes.casimir.co/eth/goerli/dkg/7',
                    '661': 'https://nodes.casimir.co/eth/goerli/dkg/8'
                }
                const url = operatorStore[operator.id.toString() as keyof typeof operatorStore]
                casimirOperators.push({
                    ...operator,
                    active,
                    collateral: ethers.utils.formatEther(collateral),
                    poolCount: poolCount.toNumber(),
                    url,
                    resharing,
                    pools
                })
            }
        }
        
        const nonregOperators = ssvOperators.filter((operator: any) => {
            const idRegistered = casimirOperators.find((registeredOperator: any) => registeredOperator.id === operator.id)
            return !idRegistered
        })

        nonregisteredOperators.value = nonregOperators as Array<Operator>
        registeredOperators.value = casimirOperators as Array<RegisteredOperator>
    }

    async function initializeUser() {
        listenForContractEvents()
        listenForTransactions()
        await Promise.all([refreshBreakdown(), getUserOperators(), getUserAnalytics()])
    }

    function listenForContractEvents() {
        try {
            console.log('listening for contract events')
            manager.on('StakeDeposited', stakeDepositedListener)
            manager.on('StakeRebalanced', stakeRebalancedListener)
            manager.on('WithdrawalInitiated', withdrawalInitiatedListener)
            registry.on('OperatorRegistered', getUserOperators)
            registry.on('OperatorDeregistered', getUserOperators)
            registry.on('DeregistrationRequested', getUserOperators)
        } catch (err) {
            console.log(`There was an error in listenForContractEvents: ${err}`)
        }
    }

    async function listenForTransactions() {
        provider.on('block', blockListener as ethers.providers.Listener)
        await new Promise(() => {
          // Wait indefinitely using a Promise that never resolves
        })
    }

    /**
     * Uses appropriate provider composable to login or sign up
     * @param provider 
     * @param address 
     * @param currency 
     * @returns 
     */
    async function login(loginCredentials: LoginCredentials, pathIndex?: number) {
        const { provider } = loginCredentials
        try {
            if (ethersProviderList.includes(provider)) {
                await loginWithEthers(loginCredentials)
            } else if (provider === 'Ledger') {
                await loginWithLedger(loginCredentials, JSON.stringify(pathIndex))
            } else if (provider === 'Trezor') {
                await loginWithTrezor(loginCredentials, JSON.stringify(pathIndex))
            } else if (provider === 'WalletConnect'){
                await loginWithWalletConnectV2(loginCredentials)
            } else {
                // TODO: Implement this for other providers
                console.log('Sign up not yet supported for this wallet provider')
            }
            await getUser()
            
        } catch (error: any) {
            throw new Error(error.message || 'There was an error logging in')
        }
    }

    async function logout() {
        await Session.signOut()
        uninitializeUser()
        // await disconnectWalletConnect()
        // TODO: Fix bug that doesn't allow you to log in without refreshing page after a user logs out
        window.location.reload()
        console.log('user.value :>> ', user.value)
    }
      
    onMounted(async () => {
        if (!initializeComposable.value) {
            initializeComposable.value = true
            const session = await Session.doesSessionExist()
            if (session) await getUser()
            await initializeWalletConnect()

            watch(user, async () => {
                console.log('User Updated', user.value)
                if (user.value) {
                    await initializeUser()
                } else {
                    uninitializeUser()
                }
            })
        }
    })
    
    onUnmounted(() => {
        uninitializeWalletConnect()
        initializeComposable.value = false
    })

    function stopListeningForContractEvents() {
        manager.removeListener('StakeDeposited', stakeDepositedListener)
        manager.removeListener('StakeRebalanced', stakeRebalancedListener)
        manager.removeListener('WithdrawalInitiated', withdrawalInitiatedListener)
    }

    async function refreshBreakdown() {
        try {
            setBreakdownValue({ name: 'currentStaked', ...await getCurrentStaked() })
            setBreakdownValue({ name: 'totalWalletBalance', ...await getTotalWalletBalance() })
            setBreakdownValue({ name: 'stakingRewardsEarned', ...await getAllTimeStakingRewards() })
        } catch (err) {
            console.log(`There was an error in refreshBreakdown: ${err}`)
        }
    }

    // TODO: Re-enable once we have a way to remove accounts in UI
    // async function removeConnectedAccount() {
    //     if (!user?.value?.address) {
    //       alert('Please login first')
    //     }
    //     if (selectedAddress.value === primaryAddress.value) {
    //       return alert('Cannot remove primary account')
    //     } else if (ethersProviderList.includes(selectedProvider.value)) {
    //       const opts = {
    //         address: selectedAddress.value,
    //         currency: selectedCurrency.value,
    //         ownerAddress: primaryAddress.value,
    //         walletProvider: selectedProvider.value
    //       }
    //       const removeAccountResult = await removeAccount(opts)
    //       if (!removeAccountResult.error) {
    //         setSelectedAddress(removeAccountResult.data.address)
    //         removeAccountResult.data.accounts.forEach((account: Account) => {
    //           if (account.address === selectedAddress.value) {
    //             setSelectedProvider(account.walletProvider as ProviderString)
    //             setSelectedCurrency(account.currency as Currency)
    //           }
    //         })
    //       }
    //     }
    //   }

    function setBreakdownValue({ name, eth, usd }: { name: BreakdownString, eth: string, usd: string}) {
        switch (name) {
            case 'currentStaked':
                currentStaked.value = {
                    eth,
                    usd
                }
            break
            case 'totalWalletBalance':
                totalWalletBalance.value = {
                    eth,
                    usd
                }
            break
            case 'stakingRewardsEarned':
                stakingRewards.value = {
                    eth,
                    usd
                }
            break
        }
    }

    async function setUserAccountBalances() {
        try {
          if (user?.value?.accounts) {
            const { accounts } = user.value
            const accountsWithBalances = await Promise.all(accounts.map(async (account: Account) => {
                const { address } = account
                const balance = await getEthersBalance(address)
                return {
                    ...account,
                    balance
                }
            }))
            user.value.accounts = accountsWithBalances
          }
        } catch (error) {
          throw new Error('Error setting user account balances')
        }
    }

    function stopListeningForTransactions() {
        provider.off('block', blockListener as ethers.providers.Listener)
    }

    function uninitializeUser() {
        // Update user accounts, operators, analytics
        user.value = undefined
        // Reset currentStaked, totalWalletBalance, and stakingRewards
        currentStaked.value = {
            eth: '0 ETH',
            usd: '$ 0.00'
        }
        totalWalletBalance.value = {
            eth: '0 ETH',
            usd: '$ 0.00'
        }
        stakingRewards.value = {
            eth: '0 ETH',
            usd: '$ 0.00'
        }
        stopListeningForContractEvents()
        stopListeningForTransactions()
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

    const stakeDepositedListener = async () => await refreshBreakdown()
    const stakeRebalancedListener = async () => await refreshBreakdown()
    const withdrawalInitiatedListener = async () => await refreshBreakdown()

    return {
        currentStaked: readonly(currentStaked),
        nonregisteredOperators: readonly(nonregisteredOperators),
        rawUserAnalytics: readonly(rawUserAnalytics),
        registeredOperators: readonly(registeredOperators),
        stakingRewards: readonly(stakingRewards),
        totalWalletBalance: readonly(totalWalletBalance),
        user: readonly(user),
        userAnalytics: readonly(userAnalytics),
        addAccountToUser,
        addOperator,
        login,
        logout,
        updateUserAgreement
    }
}

async function _getPools(operatorId: number): Promise<Pool[]> {
    const pools: Pool[] = []

    const poolIds = [
        ...await manager.getPendingPoolIds(),
        ...await manager.getStakedPoolIds()
    ]

    for (const poolId of poolIds) {
        const poolDetails = await views.getPoolDetails(poolId)
        const pool = {
            ...poolDetails,
            operatorIds: poolDetails.operatorIds.map(id => id.toNumber()),
            reshares: poolDetails.reshares.toNumber()
        }
        if (pool.operatorIds.includes(operatorId)) {
            pools.push(pool)
        }
    }
    return pools
}