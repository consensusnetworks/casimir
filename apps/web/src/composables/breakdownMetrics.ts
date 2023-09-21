import { readonly, ref, toValue } from 'vue'
import { ethers } from 'ethers'
import { Account, BreakdownAmount, BreakdownString, ContractEventsByAddress, UserWithAccountsAndOperators } from '@casimir/types'
import useContracts from '@/composables/contracts'
import useEnvironment from '@/composables/environment'
import useFormat from '@/composables/format'
import usePrice from '@/composables/price'

const { manager } = useContracts()
const { ethereumUrl } = useEnvironment()
const { formatNumber } = useFormat()
const { getCurrentPrice } = usePrice()

const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)

export default function useBreakdownMetrics() {
    const userValue = ref()

    const currentStaked = ref<BreakdownAmount>({
        eth: '0 ETH',
        usd: '$0.00'
    })
    
    const stakingRewards = ref<BreakdownAmount>({
        eth: '0 ETH',
        usd: '$0.00'
    })
    
    const totalWalletBalance = ref<BreakdownAmount>({
        eth: '0 ETH',
        usd: '$0.00'
    })

    async function getAllTimeStakingRewards() : Promise<BreakdownAmount> {
        try {
            /* Get User's Current Stake */
            const addresses = (userValue.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
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

    async function getCurrentStaked(): Promise<BreakdownAmount> {
        const addresses = (userValue.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
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

    async function getEthersBalance(address: string) : Promise<GLfloat> {
        const balance = await provider.getBalance(address)
        return parseFloat(ethers.utils.formatEther(balance))
    }

    async function getTotalWalletBalance() : Promise<BreakdownAmount> {
        const promises = [] as Array<Promise<any>>
        const addresses = (userValue.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
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

    async function refreshBreakdown() {
        try {
            setBreakdownValue({ name: 'currentStaked', ...await getCurrentStaked() })
            setBreakdownValue({ name: 'totalWalletBalance', ...await getTotalWalletBalance() })
            setBreakdownValue({ name: 'stakingRewardsEarned', ...await getAllTimeStakingRewards() })
        } catch (err) {
            console.log(`There was an error in refreshBreakdown: ${err}`)
        }
    }

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

    function stopListeningForContractEvents() {
        manager.removeListener('StakeDeposited', stakeDepositedListener)
        manager.removeListener('StakeRebalanced', stakeRebalancedListener)
        manager.removeListener('WithdrawalInitiated', withdrawalInitiatedListener)
    }

    const stakeDepositedListener = async () => await refreshBreakdown()
    const stakeRebalancedListener = async () => await refreshBreakdown()
    const withdrawalInitiatedListener = async () => await refreshBreakdown()

    async function blockListener(blockNumber: number) {
        if (!userValue.value) return
        console.log('blockNumber :>> ', blockNumber)
        const addresses = (userValue.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
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
    
    async function initializeComposable(user: UserWithAccountsAndOperators){
        userValue.value = toValue(user)
        console.log('User in initialize breakdown Metrics', userValue)
        provider.removeAllListeners('block')
        provider.on('block', blockListener as ethers.providers.Listener)
        listenForContractEvents()
        await refreshBreakdown()
    }

    async function uninitializeComposable(){
        userValue.value = undefined
        provider.removeAllListeners('block')
        stopListeningForContractEvents()
    }
    
    return {
        currentStaked: readonly(currentStaked),
        stakingRewards: readonly(stakingRewards),
        totalWalletBalance: readonly(totalWalletBalance),
        initializeComposable,
        uninitializeComposable
    }
}