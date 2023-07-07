import { ref } from 'vue'
import { ethers } from 'ethers'
import { CasimirManager, CasimirViews } from '@casimir/ethereum/build/artifacts/types'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json'
import CasimirViewsJson from '@casimir/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json'
import useEnvironment from './environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import usePrice from '@/composables/price'
import useTrezor from '@/composables/trezor'
import useUsers from '@/composables/users'
import useWalletConnect from './walletConnect'
import { Account, BreakdownAmount, BreakdownString, Pool, ProviderString, UserWithAccounts } from '@casimir/types'
import { ReadyOrStakeString } from '@/interfaces/ReadyOrStakeString'

/** Manager contract */
const managerAddress = import.meta.env.PUBLIC_MANAGER_ADDRESS
const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_RPC_URL)
const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi, provider) as CasimirManager & ethers.Contract

/** Views contract */
const viewsAddress = import.meta.env.PUBLIC_VIEWS_ADDRESS
const views: CasimirViews = new ethers.Contract(viewsAddress, CasimirViewsJson.abi) as CasimirViews

const currentStaked = ref<BreakdownAmount>({
    usd: '$0.00',
    exchange: '0 ETH'
})

const stakingRewards = ref<BreakdownAmount>({
    usd: '$0.00',
    exchange: '0 ETH'
})

const totalWalletBalance = ref<BreakdownAmount>({
    usd: '$0.00',
    exchange: '0 ETH'
})

export default function useContracts() {
    const { ethereumURL } = useEnvironment()
    const { ethersProviderList, getEthersBalance, getEthersBrowserSigner } = useEthers()
    const { getEthersLedgerSigner } = useLedger()
    const { getCurrentPrice } = usePrice()
    const { getEthersTrezorSigner } = useTrezor()
    const { user } = useUsers()
    const { isWalletConnectSigner, getEthersWalletConnectSigner } = useWalletConnect()
    
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
            console.error(`There was an error in despoit function: ${JSON.stringify(err)}`)
            return false
        }
    }

    async function getCurrentStaked(): Promise<BreakdownAmount> {
        const addresses = (user.value as UserWithAccounts).accounts.map((account: Account) => account.address) as string[]
        const promises = addresses.map((address) => manager.connect(provider).getUserStake(address))
        try {
            const settledPromises = await Promise.allSettled(promises) as Array<PromiseFulfilledResult<ethers.BigNumber>>
            const currentStaked = settledPromises
                .filter((result) => result.status === 'fulfilled')
                .map((result) => result.value)
    
            const totalStaked = currentStaked.reduce((accumulator, currentValue) => accumulator.add(currentValue), ethers.BigNumber.from(0))
            const totalStakedUSD = parseFloat(ethers.utils.formatEther(totalStaked)) * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
            const totalStakedETH = parseFloat(ethers.utils.formatEther(totalStaked))
            return {
                exchange: totalStakedETH.toFixed(2) + ' ETH',
                usd: '$ ' + totalStakedUSD.toFixed(2)
            }
        } catch (error) {
            console.log('Error occurred while fetching stake:', error)
            return {
                exchange: '0 ETH',
                usd: '$ 0.00'
            }
        }
    }
    
    async function getDepositFees() {
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
        const fees = await manager.connect(provider).feePercent()
        const feesRounded = Math.round(fees * 100) / 100
        return feesRounded
    }

    async function getPools(address: string, readyOrStake: ReadyOrStakeString): Promise<Pool[]> {
        const { user } = useUsers()
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)        
        const userStake = await manager.connect(provider).getUserStake(address) // to get user's stake balance
        const poolStake = await manager.connect(provider).getTotalStake() // to get total stake balance
        const poolIds = readyOrStake === 'ready' ? await manager.connect(provider).getReadyPoolIds() : await manager.connect(provider).getStakedPoolIds() // to get ready (open) pool IDs OR to get staked (active) pool IDs

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
            
            if (readyOrStake === 'stake') {
                user.value?.accounts.forEach((account: Account) => {
                    if (account.address === address) {
                        account.pools ? account.pools.push(pool) : account.pools = [pool]
                    }
                })
            }
            
            return pool
        }))
    }

    async function getStakingRewards() : Promise<BreakdownAmount> {
        const addresses = (user.value as UserWithAccounts).accounts.map((account: Account) => account.address) as string[]
        const promises = [] as Array<Promise<ethers.BigNumber>>
        // TODO: Replace .getUserRewards with actual method that get's rewards OR figure out how to derive rewards
        addresses.forEach((address) => {promises.push(manager.connect(provider).getUserRewards(address))})
        const stakingRewards = (await Promise.all(promises)).reduce((a, b) => a.add(b))
        const stakingRewardsUSD = parseFloat(ethers.utils.formatEther(stakingRewards)) * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
        const stakingRewardsETH = parseFloat(ethers.utils.formatEther(stakingRewards))
        return {
            exchange: stakingRewardsETH.toFixed(2) + ' ETH',
            usd: '$ ' + stakingRewardsUSD.toFixed(2)
        }
    }

    async function getTotalWalletBalance() : Promise<BreakdownAmount> {
        const promises = [] as Array<Promise<any>>
        const addresses = (user.value as UserWithAccounts).accounts.map((account: Account) => account.address) as string[]
        addresses.forEach((address) => { promises.push(getEthersBalance(address)) })
        const totalWalletBalance = (await Promise.all(promises)).reduce((acc, curr) => acc + curr, 0)
        const totalWalletBalanceUSD = totalWalletBalance * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
        return {
            exchange: totalWalletBalance.toFixed(2) + ' ETH',
            usd: '$ ' + totalWalletBalanceUSD.toFixed(2)
        }
    }

    async function getUserContractEventsTotals(address: string) {
        const eventList = [
            'StakeDeposited',
            'StakeRebalanced',
            'WithdrawalInitiated',
            'WithdrawalFulfilled'
        ]
        const eventFilters = eventList.map(event => {
            if (event === 'StakeRebalanced') return manager.filters[event]() // TODO: @shanejearley - is there a better way to handle this?
            return manager.filters[event](address)
        })
        const items = (await Promise.all(eventFilters.map(async eventFilter => await manager.queryFilter(eventFilter, 0, 'latest'))))

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
    }

    async function listenForContractEvents() {
        manager.on('StakeDeposited', async (event: any) => await refreshBreakdown())
        manager.on('StakeRebalanced', async (event: any) => await refreshBreakdown())
        manager.on('WithdrawalInitiated', async (event: any) => await refreshBreakdown())
        manager.on('WithdrawalFulfilled', async (event: any) => await refreshBreakdown())
    }

    async function refreshBreakdown() {
        setBreakdownValue({ name: 'currentStaked', ...await getCurrentStaked() })
        setBreakdownValue({ name: 'totalWalletBalance', ...await getTotalWalletBalance() })
        // setBreakdownValue({ name: 'stakingRewardsEarned', ...await getStakingRewards() })
    }

    function setBreakdownValue({ name, exchange, usd }: { name: BreakdownString, exchange: string, usd: string}) {
        switch (name) {
            case 'currentStaked':
                currentStaked.value = {
                    exchange,
                    usd
                }
            break
            case 'totalWalletBalance':
                totalWalletBalance.value = {
                    exchange,
                    usd
                }
            break
            case 'stakingRewardsEarned':
                stakingRewards.value = {
                    exchange,
                    usd
                }
            break
        }
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
        deposit, 
        getCurrentStaked,
        getDepositFees, 
        getPools, 
        listenForContractEvents,
        refreshBreakdown,
        withdraw 
    }
}