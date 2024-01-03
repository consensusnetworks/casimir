import { readonly, ref, watch } from "vue"
import { ethers } from "ethers"
import { Account, BreakdownAmount, BreakdownString, ContractEventsByAddress, UserWithAccountsAndOperators } from "@casimir/types"
import useContracts from "@/composables/contracts"
import useEnvironment from "@/composables/environment"
import useFormat from "@/composables/format"
import usePrice from "@/composables/price"
import useStaking from "@/composables/staking"
import useUser from "@/composables/user"
import { CasimirManager } from "@casimir/ethereum/build/@types"

const { getBaseManager, getEigenManager, contractsAreInitialized } = useContracts()
const { batchProvider, provider, wsProvider } = useEnvironment()
const { formatEthersCasimir } = useFormat()
const { getCurrentPrice } = usePrice()
const { awaitingStakeOrWithdrawConfirmation } = useStaking()
const { user } = useUser()

const breakdownMetricsComposableInitialized = ref(false)
const loadingInitializeBreakdownMetrics = ref(false)
const loadingInitializeBreakdownMetricsError = ref(false)
const listeningForContractEvents = ref(false)

let baseManager: CasimirManager
let eigenManager: CasimirManager

const currentStaked = ref<BreakdownAmount>({ eth: "0 ETH", usd: "$0.00" })
const stakingRewards = ref<BreakdownAmount>({ eth: "0 ETH", usd: "$0.00" })
const totalWalletBalance = ref<BreakdownAmount>({ eth: "0 ETH", usd: "$0.00" })

export default function useBreakdownMetrics() {
    async function blockListener(blockNumber: number) {
        if (!user.value) return
        if (import.meta.env.MODE === "development") console.log("blockNumber :>> ", blockNumber)
        
        const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        const availableProvider = wsProvider || provider
        const block = await availableProvider.getBlockWithTransactions(blockNumber)
        
        const txs = block.transactions.map(async (tx: any) => {
            if (addresses.includes(tx.from.toLowerCase())) {
                try {
                    // const response = (manager as CasimirManager).interface.parseTransaction({ data: tx.data })
                    // console.log('response :>> ', response)
                    await refreshBreakdown()
                } catch (error) {
                    console.error("Error parsing transaction:", error)
                }
            }
        })
    
        await Promise.all(txs)
    }

    async function initializeBreakdownMetricsComposable() {
        watch([user, contractsAreInitialized], async () => {
            if (user.value && contractsAreInitialized.value && !breakdownMetricsComposableInitialized.value) {
                await initializeBreakdownMetricsComposable()
            } else {
                uninitializeBreakdownMetricsComposable()
            }
        })

        watch(awaitingStakeOrWithdrawConfirmation, () => {
            if (awaitingStakeOrWithdrawConfirmation.value && !listeningForContractEvents.value) {
                listenForStakeWithdrawEvents()
            } else {
                stopListeningForContractEvents()
            }
        })

        if (breakdownMetricsComposableInitialized.value) return
        breakdownMetricsComposableInitialized.value = true

        baseManager = getBaseManager()
        eigenManager = getEigenManager()

        try {
            loadingInitializeBreakdownMetrics.value = true
            const availableProvider = wsProvider || provider
            availableProvider.removeAllListeners("block")
            availableProvider.on("block", blockListener as ethers.providers.Listener)
            listenForRebalancedEvents()
            await refreshBreakdown()
            loadingInitializeBreakdownMetrics.value = false
            breakdownMetricsComposableInitialized.value = true
        } catch (error) {
            loadingInitializeBreakdownMetricsError.value = true
            console.log("Error initializing breakdown metrics :>> ", error)
            loadingInitializeBreakdownMetrics.value = false
        }
    }

    async function uninitializeBreakdownMetricsComposable() {
        const availableProvider = wsProvider || provider
        availableProvider.removeAllListeners("block")
        stopListeningForContractEvents()
        breakdownMetricsComposableInitialized.value = false
    }

    async function getAllTimeStakingRewards() : Promise<BreakdownAmount> {
        try {
            /* Get User's Current Stake */
            const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
            const currentUserStakePromises = [] as Array<Promise<ethers.BigNumber>>
            addresses.forEach(address => currentUserStakePromises.push((baseManager as CasimirManager).getUserStake(address)))
            addresses.forEach(address => currentUserStakePromises.push((eigenManager as CasimirManager).getUserStake(address)))
            const settledCurrentUserStakePromises = await Promise.allSettled(currentUserStakePromises) as Array<PromiseFulfilledResult<ethers.BigNumber>>
            const currentUserStake = settledCurrentUserStakePromises.filter(result => result.status === "fulfilled").map(result => result.value)
            const currentUserStakeSum = currentUserStake.reduce((acc, curr) => acc.add(curr), ethers.BigNumber.from(0))
            const currentUserStakeETH = parseFloat(ethers.utils.formatEther(currentUserStakeSum))

            /* Get User's All Time Deposits and Withdrawals */
            const userEventTotalsPromises = [] as Array<Promise<ContractEventsByAddress>>
            addresses.forEach(address => {userEventTotalsPromises.push(getContractEventsTotalsByAddress(address, baseManager))})
            addresses.forEach(address => {userEventTotalsPromises.push(getContractEventsTotalsByAddress(address, eigenManager))})
            const userEventTotals = await Promise.all(userEventTotalsPromises) as Array<ContractEventsByAddress>
            const userEventTotalsSum = userEventTotals.reduce((acc, curr) => {
                const { StakeDeposited, WithdrawalInitiated, WithdrawalRequested, WithdrawalFulfilled } = curr
                return {
                    StakeDeposited: acc.StakeDeposited + (StakeDeposited || 0),
                    WithdrawalInitiated: acc.WithdrawalInitiated + (WithdrawalInitiated || 0),
                    WithdrawalRequested: acc.WithdrawalRequested + (WithdrawalRequested || 0),
                    WithdrawalFulfilled: acc.WithdrawalFulfilled + (WithdrawalFulfilled || 0)
                }
            }, { 
                StakeDeposited: 0, 
                WithdrawalInitiated: 0, 
                WithdrawalRequested: 0, 
                WithdrawalFulfilled: 0 
            } as { StakeDeposited: number; WithdrawalInitiated: number, WithdrawalRequested: number, WithdrawalFulfilled: number })
              
              
            const stakedDepositedETH = userEventTotalsSum.StakeDeposited
            const withdrawalInitiatedETH = userEventTotalsSum.WithdrawalInitiated
            const withdrawalRequestedETH = userEventTotalsSum.WithdrawalRequested
            const withdrawalFulfilledETH = userEventTotalsSum.WithdrawalFulfilled
            

            /* Get User's All Time Rewards */
            const currentUserStakeMinusEvents = 
                currentUserStakeETH - stakedDepositedETH + ((withdrawalInitiatedETH) + (withdrawalRequestedETH) + (withdrawalFulfilledETH))
            return {
                eth: `${formatEthersCasimir(currentUserStakeMinusEvents)} ETH`,
                usd: `$${formatEthersCasimir(currentUserStakeMinusEvents * (await getCurrentPrice({ coin: "ETH", currency: "USD" })))}`
            }
        } catch (err) {
            console.error(`There was an error in getAllTimeStakingRewards: ${err}`)
            return {
                eth: "0 ETH",
                usd: "$ 0.00"
            }
        }
    }
    
    async function getContractEventsTotalsByAddress(address: string, manager: CasimirManager) : Promise<ContractEventsByAddress> {
        try {
            const eventList = [
                "StakeDeposited",
                "StakeRebalanced",
                "WithdrawalInitiated",
                "WithdrawalRequested",
                "WithdrawalFulfilled"
            ]
            const eventFilters = eventList.map(event => {
                if (event === "StakeRebalanced") return (manager as CasimirManager).filters[event]()
                return ((manager as CasimirManager).filters as any)[event](address)
            })

            // const items = (await Promise.all(eventFilters.map(async eventFilter => await (manager as CasimirManager).queryFilter(eventFilter, 0, 'latest'))))
            // Use Promise.allSettled to avoid errors when a filter returns no results
            const items = (await Promise.allSettled(eventFilters.map(async eventFilter => await (manager as CasimirManager).queryFilter(eventFilter, 0, "latest")))).map(result => result.status === "fulfilled" ? result.value : [])
    
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
            return userEventTotals as ContractEventsByAddress
        } catch (err) {
            console.error(`There was an error in getContractEventsTotalsByAddress: ${err}`)
            return {
                StakeDeposited: 0,
                StakeRebalanced: 0,
                WithdrawalInitiated: 0,
                WithdrawalRequested: 0,
                WithdrawalFulfilled: 0
            }
        }
    }

    async function getCurrentStaked(): Promise<BreakdownAmount> {
        const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        try {
            const baseManagerPromises = addresses.map((address) => {
                // console.log("running getUserStake in getCurrentStaked")
                return (baseManager as CasimirManager).getUserStake(address)
            })
            const eigenManagerPromises = addresses.map((address) => (eigenManager as CasimirManager).getUserStake(address))
            const promises = [...baseManagerPromises, ...eigenManagerPromises]
            const settledPromises = await Promise.allSettled(promises) as Array<PromiseFulfilledResult<ethers.BigNumber>>
            const currentStaked = settledPromises
                .filter((result) => result.status === "fulfilled")
                .map((result) => result.value)
            const totalStaked = currentStaked.reduce((accumulator, currentValue) => accumulator.add(currentValue), ethers.BigNumber.from(0))
            const totalStakedUSD = parseFloat(ethers.utils.formatEther(totalStaked)) * (await getCurrentPrice({ coin: "ETH", currency: "USD" }))
            const totalStakedETH = parseFloat(ethers.utils.formatEther(totalStaked))
            const formattedTotalStakedUSD = formatEthersCasimir(totalStakedUSD)
            const formattedTotalStakedETH = formatEthersCasimir(totalStakedETH)
            return {
                eth: formattedTotalStakedETH + " ETH",
                usd: "$ " + formattedTotalStakedUSD
            }
        } catch (error) {
            console.log("Error occurred while fetching stake:", error)
            return {
                eth: "0ETH",
                usd: "$0.00"
            }
        }
    }

    async function getTotalWalletBalance(): Promise<BreakdownAmount> {
        try {
            const addresses = (user.value as UserWithAccountsAndOperators).accounts.map(account => account.address)
            const balancePromises = addresses.map((address: string) => batchProvider.getBalance(address))
            const balances = await Promise.all(balancePromises)
            const totalWalletBalance = balances.reduce((acc, curr) => acc.add(curr), ethers.BigNumber.from(0))
            const totalWalletBalanceUSD = (await getCurrentPrice({ coin: "ETH", currency: "USD" })) * parseFloat(ethers.utils.formatEther(totalWalletBalance))
            const formattedTotalWalletBalance = ethers.utils.formatEther(totalWalletBalance)
            const roundedFormattedTotalWalletBalance = formatEthersCasimir(parseFloat(formattedTotalWalletBalance))
            const formattedTotalWalletBalanceUSD = formatEthersCasimir(totalWalletBalanceUSD, 2)
            return {
                eth: roundedFormattedTotalWalletBalance + " ETH",
                usd: "$ " + formattedTotalWalletBalanceUSD
            }
        } catch (error) {
            console.log("Error occurred in getTotalWalletBalance:", error)
            return {
                eth: "0ETH",
                usd: "$0.00"
            }
        }
    }
    
    async function refreshBreakdown() {
        try {
            setBreakdownValue({ name: "currentStaked", ...await getCurrentStaked() })
            setBreakdownValue({ name: "totalWalletBalance", ...await getTotalWalletBalance() })
            setBreakdownValue({ name: "stakingRewardsEarned", ...await getAllTimeStakingRewards() })
        } catch (err) {
            console.log(`There was an error in refreshBreakdown: ${err}`)
        }
    }

    function setBreakdownValue({ name, eth, usd }: { name: BreakdownString, eth: string, usd: string}) {
        switch (name) {
        case "currentStaked":
            currentStaked.value = { eth, usd }
            break
        case "totalWalletBalance":
            totalWalletBalance.value = { eth, usd }
            break
        case "stakingRewardsEarned":
            stakingRewards.value = { eth, usd }
            break
        }
    }

    function listenForStakeWithdrawEvents() {
        if (!breakdownMetricsComposableInitialized.value) return
        stopListeningForContractEvents() // Clear old listeners
        listeningForContractEvents.value = true
        try {
            (baseManager as CasimirManager).on("StakeDeposited", stakeDepositedListener);
            (baseManager as CasimirManager).on("WithdrawalInitiated", withdrawalInitiatedListener);
            (eigenManager as CasimirManager).on("StakeDeposited", stakeDepositedListener);
            (eigenManager as CasimirManager).on("WithdrawalInitiated", withdrawalInitiatedListener)
        } catch (err) {
            console.log(`There was an error in listenForStakeWithdrawEvents: ${err}`)
        }
    }

    function listenForRebalancedEvents() {
        if (!breakdownMetricsComposableInitialized.value) return
        stopListeningForContractEvents() // Clear old listeners
        try {
            (baseManager as CasimirManager).on("StakeRebalanced", stakeRebalancedListener)
            // (eigenManager as CasimirManager).on("StakeRebalanced", stakeRebalancedListener)
        } catch (err) {
            console.log(`There was an error in listenForRebalancedEvents: ${err}`)
        }
    }

    function stopListeningForContractEvents() {
        listeningForContractEvents.value = false
        if (!breakdownMetricsComposableInitialized.value) return
        (baseManager as CasimirManager).removeListener("StakeDeposited", stakeDepositedListener);
        (baseManager as CasimirManager).removeListener("StakeRebalanced", stakeRebalancedListener);
        (baseManager as CasimirManager).removeListener("WithdrawalInitiated", withdrawalInitiatedListener);
        (eigenManager as CasimirManager).removeListener("StakeDeposited", stakeDepositedListener);
        (eigenManager as CasimirManager).removeListener("StakeRebalanced", stakeRebalancedListener);
        (eigenManager as CasimirManager).removeListener("WithdrawalInitiated", withdrawalInitiatedListener)
    }

    const stakeDepositedListener = async () => await refreshBreakdown()
    const stakeRebalancedListener = async () => await refreshBreakdown()
    const withdrawalInitiatedListener = async () => await refreshBreakdown()
    
    return {
        currentStaked: readonly(currentStaked),
        loadingInitializeBreakdownMetrics: readonly(loadingInitializeBreakdownMetrics),
        loadingInitializeBreakdownMetricsError: readonly(loadingInitializeBreakdownMetricsError),
        stakingRewards: readonly(stakingRewards),
        totalWalletBalance: readonly(totalWalletBalance),
        initializeBreakdownMetricsComposable,
        uninitializeBreakdownMetricsComposable
    }
}