import { onMounted, onUnmounted, readonly, ref, watch } from 'vue'
import * as Session from 'supertokens-web-js/recipe/session'
import { ethers } from 'ethers'
import { Account, BreakdownAmount, BreakdownString, ContractEventsByAddress, LoginCredentials, UserWithAccountsAndOperators } from '@casimir/types'
import useContracts from '@/composables/contracts'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useFormat from '@/composables/format'
import useLedger from '@/composables/ledger'
import usePrice from '@/composables/price'
import useTrezor from '@/composables/trezor'
import useWalletConnect from '@/composables/walletConnectV2'

// Test address: 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const { manager} = useContracts()
const { ethereumUrl, usersUrl } = useEnvironment()
const { ethersProviderList, loginWithEthers } = useEthers()
const { formatNumber } = useFormat()
const { loginWithLedger } = useLedger()
const { loginWithTrezor } = useTrezor()
const { getCurrentPrice } = usePrice()
const { loginWithWalletConnectV2, initializeWalletConnect, uninitializeWalletConnect } = useWalletConnect()

const initializeComposable = ref(false)
const initializedUser = ref(false)
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
const user = ref<UserWithAccountsAndOperators | undefined>(undefined)

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

    async function blockListener(blockNumber: number) {
        if (!user.value) return
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

    function listenForContractEvents() {
        stopListeningForContractEvents() // Clear old listeners
        try {
            manager.on('StakeDeposited', stakeDepositedListener)
            manager.on('StakeRebalanced', stakeRebalancedListener)
            manager.on('WithdrawalInitiated', withdrawalInitiatedListener)
        } catch (err) {
            console.log(`There was an error in listenForContractEvents: ${err}`)
        }
    }

    async function listenForTransactions() {
        stopListeningForTransactions()
        provider.on('block', blockListener as ethers.providers.Listener)
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
        // TODO: Fix bug that doesn't allow you to log in without refreshing page after a user logs out
        window.location.reload()
    }
      
    onMounted(async () => {
        if (!initializeComposable.value) {
            initializeComposable.value = true
            listenForContractEvents()
            listenForTransactions()
            watch(user, async () => {
                if (user.value && !initializedUser.value) {
                    initializedUser.value = true
                    await Promise.all([refreshBreakdown()])
                } else if (!user.value) {
                    uninitializeUser()
                }
            })
            const session = await Session.doesSessionExist()
            if (session) await getUser()
            await initializeWalletConnect()
        }
    })
    
    onUnmounted(() => {
        uninitializeWalletConnect()
        stopListeningForContractEvents()
        stopListeningForTransactions()
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
        provider.removeAllListeners('block')
    }

    function uninitializeUser() {
        // Update user accounts
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
        stakingRewards: readonly(stakingRewards),
        totalWalletBalance: readonly(totalWalletBalance),
        user: readonly(user),
        addAccountToUser,
        login,
        logout,
        updateUserAgreement
    }
}