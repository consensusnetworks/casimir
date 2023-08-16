import { ref } from 'vue'
import { BigNumberish, ethers } from 'ethers'
import { CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'
import useEnvironment from './environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import usePrice from '@/composables/price'
import useTrezor from '@/composables/trezor'
import useUsers from '@/composables/users'
import useFormat from '@/composables/format'
import useWalletConnect from './walletConnect'
import useWalletConnectV2 from './walletConnectV2'
import { Account, BreakdownAmount, BreakdownString, ContractEventsByAddress, Pool, ProviderString, RegisteredOperator, UserWithAccountsAndOperators } from '@casimir/types'
import { Operator, Scanner } from '@casimir/ssv'

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

const { ethereumUrl, managerAddress, registryAddress, ssvNetworkAddress, ssvNetworkViewsAddress, viewsAddress } = useEnvironment()
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
const manager: CasimirManager & ethers.Contract = new ethers.Contract(managerAddress, ICasimirManagerAbi, provider) as CasimirManager
const views: CasimirViews & ethers.Contract = new ethers.Contract(viewsAddress, ICasimirViewsAbi, provider) as CasimirViews
const registry: CasimirRegistry & ethers.Contract = new ethers.Contract(registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry

const operators = ref<Operator[]>([])
const registeredOperators = ref<Operator[]>([])
const nonregisteredOperators = ref<Operator[]>([])

export default function useContracts() {
    const { ethersProviderList, getEthersBalance, getEthersBrowserSigner } = useEthers()
    const { formatNumber } = useFormat()
    const { getEthersLedgerSigner } = useLedger()
    const { getCurrentPrice } = usePrice()
    const { getEthersTrezorSigner } = useTrezor()
    const { user } = useUsers()
    const { isWalletConnectSigner, getEthersWalletConnectSigner } = useWalletConnect()
    const { getEthersWalletConnectSignerV2 } = useWalletConnectV2()

    const stakeDepositedListener = async () => await refreshBreakdown()
    const stakeRebalancedListener = async () => await refreshBreakdown()
    const withdrawalInitiatedListener = async () => await refreshBreakdown()
    
    async function deposit({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
        try {
            // const ethAmount = (parseInt(amount) / (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))).toString()
            const signerCreators = {
                'Browser': getEthersBrowserSigner,
                'Ledger': getEthersLedgerSigner,
                'Trezor': getEthersTrezorSigner,
                'WalletConnect': getEthersWalletConnectSignerV2
            }
            const signerType = ethersProviderList.includes(walletProvider) ? 'Browser' : walletProvider
            const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
            let signer = signerCreator(walletProvider)
            // if (isWalletConnectSigner(signer)) signer = await signer
            signer = await signer
            console.log('signer in deposit :>> ', signer)
            const managerSigner = manager.connect(signer as ethers.Signer)
            const fees = await getDepositFees()
            const depositAmount = parseFloat(amount) * ((100 + fees) / 100)
            const value = ethers.utils.parseEther(depositAmount.toString())
            const result = await managerSigner.depositStake({ value, type: 0 })
            await result.wait()
            return true
        } catch (err) {
            console.error(`There was an error in deposit function: ${JSON.stringify(err)}`)
            return false
        }
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

            /* Get User's All Time Rewards by Subtracting (StakeDesposited + WithdrawalInitiated) from CurrentStake */
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
        const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
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

    async function getDepositFees() {
        const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
        const fees = await manager.feePercent()
        const feesRounded = Math.round(fees * 100) / 100
        return feesRounded
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
                // TODO: Replace once we have this working again
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

        _setOperators(nonregOperators, 'nonregistered')
        _setOperators(casimirOperators, 'registered')
    }

    // async function _getSSVOperators(): Promise<SSVOperator[]> {
    //     const ownerAddresses = (user?.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
    //     // const ownerAddressesTest = ['0x9725Dc287005CB8F11CA628Bb769E4A4Fc8f0309']
    //     try {
    //         // const promises = ownerAddressesTest.map((address) => _querySSVOperators(address))
    //         const promises = ownerAddresses.map((address) => _querySSVOperators(address))
    //         const settledPromises = await Promise.allSettled(promises) as Array<PromiseFulfilledResult<any>>
    //         const operators = settledPromises
    //             .filter((result) => result.status === 'fulfilled')
    //             .map((result) => result.value)

    //         const ssvOperators = (operators[0] as Array<any>).map((operator) => {
    //             const { id, fee, name, owner_address, performance } = operator
    //             return {
    //                 id: id.toString(),
    //                 fee: ethers.utils.formatEther(fee),
    //                 name,
    //                 ownerAddress: owner_address,
    //                 performance
    //             } as SSVOperator
    //         })
            
    //         return ssvOperators
    //     } catch (err) {
    //         console.error(`There was an error in _getSSVOperators function: ${JSON.stringify(err)}`)
    //         return []
    //     }
    // }

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

    async function getUserStake(address: string): Promise<number> {
        try {
            const bigNumber = await manager.getUserStake(address)
            const number = parseFloat(ethers.utils.formatEther(bigNumber))
            return number
        } catch (err) {
            console.error(`There was an error in getUserStake function: ${JSON.stringify(err)}`)
            return 0
        }
    }

    async function listenForContractEvents() {
        try {
            manager.on('StakeDeposited', stakeDepositedListener)
            manager.on('StakeRebalanced', stakeRebalancedListener)
            manager.on('WithdrawalInitiated', withdrawalInitiatedListener)
        } catch (err) {
            console.log(`There was an error in listenForContractEvents: ${err}`)
        }
    }

    async function _querySSVOperators(address: string) {
        try {
            const network = 'prater'
            const url = `https://api.ssv.network/api/v3/${network}/operators/owned_by/${address}`
            const response = await fetch(url)
            const { operators } = await response.json()
            return operators
        } catch (err) {
            console.error(`There was an error in _querySSVOperators function: ${JSON.stringify(err)}`)
            return []
        }
    }

    async function refreshBreakdown() {
        try {
            if (!user.value?.id) {
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
            }
            setBreakdownValue({ name: 'currentStaked', ...await getCurrentStaked() })
            setBreakdownValue({ name: 'totalWalletBalance', ...await getTotalWalletBalance() })
            setBreakdownValue({ name: 'stakingRewardsEarned', ...await getAllTimeStakingRewards() })
        } catch (err) {
            console.log(`There was an error in refreshBreakdown: ${err}`)
        }
    }

    async function registerOperatorWithCasimir(walletProvider: ProviderString, address: string, operatorId: BigNumberish, value: string) {
        try {
            const signerCreators = {
                'Browser': getEthersBrowserSigner,
                'Ledger': getEthersLedgerSigner,
                'Trezor': getEthersTrezorSigner,
                'WalletConnect': getEthersWalletConnectSigner
            }
            const signerType = ethersProviderList.includes(walletProvider) ? 'Browser' : walletProvider
            const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
            let signer = signerCreator(walletProvider)
            if (isWalletConnectSigner(signer)) signer = await signer
            const result = await registry.connect(signer as ethers.Signer).registerOperator(operatorId, { from: address, value: ethers.utils.parseEther(value)})
            await result.wait()
            return true
        } catch (err) {
            console.error(`There was an error in registerOperatorWithCasimir function: ${JSON.stringify(err)}`)
            return false
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

    function _setOperators(operatorsArray: Operator[], type: 'nonregistered' | 'registered') {
        switch (type) {
            case 'nonregistered':
                nonregisteredOperators.value = operatorsArray as Array<Operator>
            break
            case 'registered':
                registeredOperators.value = operatorsArray as Array<Operator>
            break
        }
    }

    function stopListeningForContractEvents() {
        manager.removeListener('StakeDeposited', stakeDepositedListener)
        manager.removeListener('StakeRebalanced', stakeRebalancedListener)
        manager.removeListener('WithdrawalInitiated', withdrawalInitiatedListener)
    }

    async function withdraw({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
        const signerCreators = {
            'Browser': getEthersBrowserSigner,
            'Ledger': getEthersLedgerSigner,
            'Trezor': getEthersTrezorSigner,
            'WalletConnect': getEthersWalletConnectSigner
        }
        const signerType = ['MetaMask', 'CoinbaseWallet'].includes(walletProvider) ? 'Browser' : walletProvider
        const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
        let signer = signerCreator(walletProvider)
        if (isWalletConnectSigner(signer)) signer = await signer
        const managerSigner = manager.connect(signer as ethers.Signer)
        const value = ethers.utils.parseEther(amount)
        // const withdrawableBalance = await manager.getWithdrawableBalance()
        const result = await managerSigner.requestWithdrawal(value)
        return await result.wait()
    }

    return { 
        currentStaked, 
        manager, 
        operators,
        registeredOperators,
        stakingRewards,
        totalWalletBalance,
        nonregisteredOperators,
        deposit, 
        getCurrentStaked,
        getDepositFees,
        getUserOperators,
        getUserStake,
        listenForContractEvents,
        refreshBreakdown,
        registerOperatorWithCasimir,
        stopListeningForContractEvents,
        withdraw 
    }
}