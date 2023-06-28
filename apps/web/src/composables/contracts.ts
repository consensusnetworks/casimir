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
import { Account, BreakdownAmount, BreakdownString, Pool, ProviderString } from '@casimir/types'
import { ReadyOrStakeString } from '@/interfaces/ReadyOrStakeString'

/** Manager contract */
const managerAddress = import.meta.env.PUBLIC_MANAGER_ADDRESS
const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_RPC_URL)
const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi, provider) as CasimirManager & ethers.Contract

/** Views contract */
const viewsAddress = import.meta.env.PUBLIC_VIEWS_ADDRESS
const views: CasimirViews = new ethers.Contract(viewsAddress, CasimirViewsJson.abi) as CasimirViews

const { user } = useUsers()
const { getCurrentPrice } = usePrice()

const currentStaked = ref<BreakdownAmount>({
    usd: '$0.00',
    exchange: '0 ETH'
})

const stakingRewards = ref<BreakdownAmount>({
    usd: '$0.00',
    exchange: '0 ETH'
})

const totalDeposited = ref<BreakdownAmount>({
    usd: '$0.00',
    exchange: '0 ETH'
})

export default function useContracts() {
    const { ethereumURL } = useEnvironment()
    const { ethersProviderList, getEthersBrowserSigner } = useEthers()
    const { getEthersLedgerSigner } = useLedger()
    const { getEthersTrezorSigner } = useTrezor()
    const { isWalletConnectSigner, getEthersWalletConnectSigner } = useWalletConnect()
    
    async function deposit({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
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
        const fees = await managerSigner.feePercent()
        const depositAmount = parseFloat(amount) * ((100 + fees) / 100)
        const value = ethers.utils.parseEther(depositAmount.toString())
        const result = await managerSigner.depositStake({ value, type: 0 })
        return await result.wait()
    }

    async function getCurrentStaked() : Promise<BreakdownAmount> {
        const addresses = user.value?.accounts.map((account: Account) => account.address) as Array<string>
        const promises = [] as Array<Promise<ethers.BigNumber>>
        addresses.forEach((address) => {promises.push(manager.connect(provider).getUserStake(address))})
        const currentStaked = (await Promise.all(promises)).reduce((a, b) => a.add(b))
        const currentStakedUSD = parseFloat(ethers.utils.formatEther(currentStaked)) * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
        const currentStakedETH = parseFloat(ethers.utils.formatEther(currentStaked))
        return {
            exchange: currentStakedETH.toFixed(2) + ' ETH',
            usd: '$ ' + currentStakedUSD.toFixed(2)
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
        const addresses = user.value?.accounts.map((account: Account) => account.address) as Array<string>
        const promises = [] as Array<Promise<ethers.BigNumber>>
        addresses.forEach((address) => {promises.push(manager.connect(provider).getUserRewards(address))})
        const stakingRewards = (await Promise.all(promises)).reduce((a, b) => a.add(b))
        const stakingRewardsUSD = parseFloat(ethers.utils.formatEther(stakingRewards)) * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
        const stakingRewardsETH = parseFloat(ethers.utils.formatEther(stakingRewards))
        return {
            exchange: stakingRewardsETH.toFixed(2) + ' ETH',
            usd: '$ ' + stakingRewardsUSD.toFixed(2)
        }
    }

    async function getTotalDeposited() : Promise<BreakdownAmount> {
        const promises = [] as Array<Promise<any>>
        const addresses = user.value?.accounts.map((account: Account) => account.address) as Array<string>
        addresses.forEach((address) => { promises.push(getUserContractEventsTotals(address)) })
        const totalDeposited = (await Promise.all(promises)).reduce((acc, curr) => acc + curr.StakeDeposited, 0)
        const totalDepositedUSD = totalDeposited * (await getCurrentPrice({ coin: 'ETH', currency: 'USD' }))
        return {
            exchange: totalDeposited.toFixed(2) + ' ETH',
            usd: '$ ' + totalDepositedUSD.toFixed(2)
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
        // setBreakdownValue({ name: 'totalDeposited', ...await getTotalDeposited() })
        // setBreakdownValue({ name: 'stakingRewards', ...await getStakingRewards() })
    }

    function setBreakdownValue({ name, exchange, usd }: { name: BreakdownString, exchange: string, usd: string}) {
        switch (name) {
            case 'currentStaked':
                currentStaked.value = {
                    exchange,
                    usd
                }
            break
            case 'totalDeposited':
                totalDeposited.value = {
                    exchange,
                    usd
                }
            break
            case 'stakingRewards':
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
        const withdrawableBalance = await manager.getWithdrawableBalance()
        console.log('withdrawableBalance :>> ', withdrawableBalance)
        const result = await managerSigner.requestWithdrawal(value)

        // Get user stake and print to console
        const promises = [] as any[]
        const accounts = user.value?.accounts
        const addresses = accounts?.map(account => account.address)
        promises.push(getCurrentStaked(addresses as string[]))
        const promisesResults = await Promise.all(promises)
        console.log('promisesResults in withdraw :>> ', promisesResults)
        return await result.wait()
    }

    return { 
        currentStaked, 
        manager, 
        stakingRewards, 
        totalDeposited, 
        deposit, 
        getCurrentStaked,
        getDepositFees, 
        getPools, 
        listenForContractEvents,
        refreshBreakdown,
        withdraw 
    }
}