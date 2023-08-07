import { ref } from 'vue'
import { BigNumberish, ethers } from 'ethers'
import { CasimirManager, CasimirRegistry, CasimirViews, ISSVNetworkViews } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'
import ISSVNetworkViewsAbi from '@casimir/ethereum/build/abi/ISSVNetworkViews.json'
import useEnvironment from './environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import usePrice from '@/composables/price'
import useTrezor from '@/composables/trezor'
import useUsers from '@/composables/users'
import useWalletConnect from './walletConnect'
import { Account, BreakdownAmount, BreakdownString, ContractEventsByAddress, Pool, ProviderString, UserWithAccountsAndOperators } from '@casimir/types'

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
const manager: CasimirManager & ethers.Contract = new ethers.Contract(managerAddress, ICasimirManagerAbi) as CasimirManager
const casimirViews: CasimirViews & ethers.Contract = new ethers.Contract(viewsAddress, ICasimirViewsAbi) as CasimirViews
const casimirOperatorRegistry: CasimirRegistry & ethers.Contract = new ethers.Contract(registryAddress, ICasimirRegistryAbi) as CasimirRegistry
// const ssvViews: ISSVNetworkViews & ethers.Contract = new ethers.Contract(ssvNetworkViewsAddress, ISSVNetworkViewsAbi) as ISSVNetworkViews

interface UserOperators {
    ssv: SSVOperator[]
    casimir: CasimirOperator[]
  }
  
interface SSVOperator {
    fee: string
    id: string
    name: string
    ownerAddress: string
}

interface CasimirOperator {
    availableCollateral?: string
    collateralInUse?: string
    id: string
    nodeURL?: string
    rewards?: string
    walletAddress?: string
}


const userOperators = ref<UserOperators>({
    ssv: [],
    casimir: []
})

export default function useContracts() {
    const { ethersProviderList, getEthersBalance, getEthersBrowserSigner } = useEthers()
    const { getEthersLedgerSigner } = useLedger()
    const { getCurrentPrice } = usePrice()
    const { getEthersTrezorSigner } = useTrezor()
    const { user } = useUsers()
    const { isWalletConnectSigner, getEthersWalletConnectSigner } = useWalletConnect()

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
                'WalletConnect': getEthersWalletConnectSigner
            }
            const signerType = ethersProviderList.includes(walletProvider) ? 'Browser' : walletProvider
            const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
            let signer = signerCreator(walletProvider)
            if (isWalletConnectSigner(signer)) signer = await signer
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

    async function getCurrentStaked(): Promise<BreakdownAmount> {
        const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
        const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        try {
            const promises = addresses.map((address) => manager.connect(provider).getUserStake(address))
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

    /** Get all user operators */
    async function getUserOperators() {
        const userAddresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        
        const ssvOperators = await _getSSVOperators()
        const ssvOperatorsByUser = ssvOperators.filter((ssvOperator: any) => {
            return userAddresses.some((address) => { address === ssvOperator.walletAddress })
        })
        const ssvOperatorIdsByUser = ssvOperatorsByUser.map((ssvOperator: SSVOperator) => ssvOperator.id.toString())

        const casimirOperators = await _getCasimirOperators()
        const casimirOperatorsByUser = casimirOperators.filter((casimirOperator: CasimirOperator) => {
            return ssvOperatorIdsByUser.some((id: string) => { id === casimirOperator.id })
        })

        if (casimirOperatorsByUser.length) {
            // Need to update each casimirOperator with availableCollateral, collateralInUse, nodeURL, rewards, and walletAddress
            casimirOperatorsByUser.forEach((casimirOperator) => {
                const ssvOperator = ssvOperators.find((ssvOperator: SSVOperator) => {
                    return ssvOperator.id.toString() === casimirOperator.id
                })
                if (ssvOperator) {
                    casimirOperator.availableCollateral = ssvOperator.availableCollateral
                    casimirOperator.collateralInUse = ssvOperator.collateralInUse
                    casimirOperator.nodeURL = ssvOperator.nodeURL
                    casimirOperator.rewards = ssvOperator.rewards
                    casimirOperator.walletAddress = ssvOperator.owner_address
                }
            })
        }

        console.log('casimirOperatorsByUser in getUserOperators :>> ', casimirOperatorsByUser)
        _setUserOperators('casimir', casimirOperatorsByUser)
        _setUserOperators('ssv', ssvOperators)
        return {
            ssv: ssvOperators,
            casimir: casimirOperators
        }
    }

    async function _getCasimirOperators() {
        try {
            const registry = casimirOperatorRegistry.connect(provider)

            const operatorIds = await registry.getOperatorIds()
            const startIndex = 0
            const endIndex = operatorIds.length
            const rawOperators = await casimirViews.connect(provider).getOperators(startIndex, endIndex)

            const operators = rawOperators.map((operator) => {
                const { id, active, resharing, collateral, poolCount } = operator
                return {
                    id: id.toString(),
                    collateral: ethers.utils.formatEther(collateral),
                } as CasimirOperator
            })
            return operators
        } catch (err) {
            console.error(`There was an error in _getCasimirOperators function: ${JSON.stringify(err)}`)
            return []
        }
    }

    async function _getSSVOperators(): Promise<SSVOperator[]> {
        const ownerAddresses = (user?.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
        // const ownerAddressesTest = ['0x9725Dc287005CB8F11CA628Bb769E4A4Fc8f0309']
        try {
            // const promises = ownerAddressesTest.map((address) => _querySSVOperators(address))
            const promises = ownerAddresses.map((address) => _querySSVOperators(address))
            const settledPromises = await Promise.allSettled(promises) as Array<PromiseFulfilledResult<any>>
            const operators = settledPromises
                .filter((result) => result.status === 'fulfilled')
                .map((result) => result.value)

            const ssvOperators = (operators[0] as Array<any>).map((operator) => {
                const { id, fee, name, owner_address } = operator
                return {
                    id: id.toString(),
                    fee: ethers.utils.formatEther(fee),
                    name,
                    ownerAddress: owner_address,
                } as SSVOperator
            })
            
            return ssvOperators
        } catch (err) {
            console.error(`There was an error in _getSSVOperators function: ${JSON.stringify(err)}`)
            return []
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
            const result = await casimirOperatorRegistry.connect(signer as ethers.Signer).register(operatorId, { from: address, value: ethers.utils.parseEther(value)})
            console.log('register result :>> ', result)
            await result.wait()
            return true
        } catch (err) {
            console.error(`There was an error in registerOperatorWithCasimir function: ${JSON.stringify(err)}`)
            return false
        }
    }

    async function getUserStake(address: string): Promise<number> {
        try {
            const bigNumber = await manager.connect(provider).getUserStake(address)
            const number = parseFloat(ethers.utils.formatEther(bigNumber))
            return number
        } catch (err) {
            console.error(`There was an error in getUserStake function: ${JSON.stringify(err)}`)
            return 0
        }
    }
    
    async function getDepositFees() {
        const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
        const fees = await manager.connect(provider).feePercent()
        const feesRounded = Math.round(fees * 100) / 100
        return feesRounded
    }

    /*
    async function getPools(address: string): Promise<Pool[]> {
        const { user } = useUsers()
        const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)        
        const userStake = await manager.connect(provider).getUserStake(address) // to get user's stake balance
        const poolStake = await manager.connect(provider).getTotalStake() // to get total stake balance
        const poolIds = [
            ...await manager.connect(provider).getPendingPoolIds(),
            ...await manager.connect(provider).getStakedPoolIds()
        ]

        console.log('userStake :>> ', ethers.utils.formatEther(userStake))
        console.log('poolStake :>> ', ethers.utils.formatEther(poolStake))
        console.log('poolIds :>> ', poolIds)

        return await Promise.all(poolIds.map(async (poolId: number) => {
            const { publicKey, operatorIds } = await views.connect(provider).getPoolDetails(poolId)
            
            // TODO: Decide when/how to get rewards/userRewards
            let pool: Pool = {
                id: poolId,
                rewards: ethers.utils.formatEther(poolStake),
                stake: ethers.utils.formatEther(poolStake),
                userRewards: ethers.utils.formatEther(userStake),
                userStake: ethers.utils.formatEther(userStake)
            }

            if (publicKey) {
                // Validator data from beaconcha.in hardcoded for now
                // const response = await fetch(`https://prater.beaconcha.in/api/v1/validator/${validatorPublicKey}`)
                // const { data } = await response.json()
                // const { status } = data
                const validator = {
                    publicKey,
                    status: 'Active',
                    effectiveness: '0%',
                    apr: '0%', // See issue #205 https://github.com/consensusnetworks/casimir/issues/205#issuecomment-1338142532
                    url: `https://prater.beaconcha.in/validator/${publicKey}`
                }


                // TODO: Replace with less hardcoded network call?
                const operators = await Promise.all(operatorIds.map(async (operatorId) => {
                    const network = 'prater'
                    const response = await fetch(`https://api.ssv.network/api/v3/${network}/operators/${operatorId}`)
                    const { performance } = await response.json()
                    return {
                        id: operatorId.toNumber(),
                        '24HourPerformance': performance['24h'],
                        '30DayPerformance': performance['30d'],
                        url: `https://explorer.ssv.network/operators/${operatorId}`
                    }
                }))

                pool = {
                    ...pool,
                    validator,
                    operators
                }
            }
            
            user.value?.accounts.forEach(account => {
                if (account.address === address) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    account.pools ? account.pools.push(pool) : account.pools = [pool]
                }
            })
            
            return pool
        }))
    }
    */

    async function getAllTimeStakingRewards() : Promise<BreakdownAmount> {
        try {
            /* Get User's Current Stake */
            const addresses = (user.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
            const currentUserStakePromises = [] as Array<Promise<ethers.BigNumber>>
            addresses.forEach(address => currentUserStakePromises.push(manager.connect(provider).getUserStake(address)))
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

    async function getContractEventsTotalsByAddress(address: string) : Promise<ContractEventsByAddress> {
        try {
            const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
            const eventList = [
                'StakeDeposited',
                'StakeRebalanced',
                'WithdrawalInitiated'
            ]
            const eventFilters = eventList.map(event => {
                if (event === 'StakeRebalanced') return manager.filters[event]()
                return manager.filters[event](address)
            })

            // const items = (await Promise.all(eventFilters.map(async eventFilter => await manager.connect(provider).queryFilter(eventFilter, 0, 'latest'))))
            // Use Promise.allSettled to avoid errors when a filter returns no results
            const items = (await Promise.allSettled(eventFilters.map(async eventFilter => await manager.connect(provider).queryFilter(eventFilter, 0, 'latest')))).map(result => result.status === 'fulfilled' ? result.value : [])
            console.log('items :>> ', items)
    
            const userEventTotals = eventList.reduce((acc, event) => {
                acc[event] = 0
                return acc
            }, {} as { [key: string]: number })
    
            for (const item of items) {
                for (const action of item) {
                    const { args, event } = action
                    console.log('event :>> ', event)
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

    function stopListeningForContractEvents() {
        manager.removeListener('StakeDeposited', stakeDepositedListener)
        manager.removeListener('StakeRebalanced', stakeRebalancedListener)
        manager.removeListener('WithdrawalInitiated', withdrawalInitiatedListener)
    }

    function _setUserOperators(key: 'ssv' | 'casimir', operators: Array<SSVOperator | CasimirOperator>) {
        userOperators.value[key] = operators as Array<SSVOperator | CasimirOperator>
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
        stakingRewards, 
        totalWalletBalance,
        userOperators,
        deposit, 
        getCurrentStaked,
        getDepositFees,
        getUserOperators,
        getUserStake,
        // getPools, 
        _getCasimirOperators,
        listenForContractEvents,
        refreshBreakdown,
        registerOperatorWithCasimir,
        stopListeningForContractEvents,
        withdraw 
    }
}

function formatNumber(number: number) {
    const SI_SYMBOL = ['', 'K', 'M', 'B', 'T', 'P', 'E']
    const tier = Math.log10(Math.abs(number)) / 3 | 0
    if(tier === 0) return number.toFixed(2)
    const suffix = SI_SYMBOL[tier]
    const scale = Math.pow(10, tier * 3)
    const scaled = number / scale
    return scaled.toFixed(2) + suffix
}