import { readonly, ref } from 'vue'
import { Operator, Scanner } from '@casimir/ssv'
import { Account, ManagerConfig, PoolConfig, RegisteredOperator, RegisterOperatorWithCasimirParams, UserWithAccountsAndOperators } from '@casimir/types'
import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnectV2 from '@/composables/walletConnectV2'
import { CasimirManager, CasimirRegistry, CasimirViews, CasimirFactory } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'
import ICasimirFactoryAbi from '@casimir/ethereum/build/abi/ICasimirFactory.json'

let manager: CasimirManager
let registry: CasimirRegistry
let views: CasimirViews

const { ethereumUrl, provider, ssvNetworkAddress, ssvViewsAddress, usersUrl } = useEnvironment()
const { ethersProviderList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { getWalletConnectSignerV2 } = useWalletConnectV2()
const loadingInitializeOperators = ref(false)
const loadingInitializeOperatorsError = ref(false)

export default function useOperators() {
    const loadingAddOperator = ref(false)
    const loadingAddOperatorError = ref(false)
    const loadingRegisteredOperators = ref(false)
    const loadingRegisteredOperatorsError = ref(false)

    const nonregisteredOperators = ref<Operator[]>([])
    const registeredOperators = ref<Operator[]>([])

    async function addOperator({ address, nodeUrl }: { address: string, nodeUrl: string }) {
        try {
            loadingAddOperator.value = true
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address, nodeUrl })
            }
            const response = await fetch(`${usersUrl}/user/add-operator`, requestOptions)
            const { error, message } = await response.json()
            loadingAddOperator.value = false
            return { error, message }
        } catch (error: any) {
            throw new Error(error.message || 'Error adding operator')
            loadingAddOperatorError.value = true
        }
    }

    async function getUserOperators(user: UserWithAccountsAndOperators): Promise<void> {
        const userAddresses = user?.accounts.map((account: Account) => account.address) as string[]

        const scanner = new Scanner({ 
            ethereumUrl,
            ssvNetworkAddress,
            ssvViewsAddress
        })

        const ssvOperators: Operator[] = []
        for (const address of userAddresses) {
            const userOperators = await scanner.getOperators(address)
            ssvOperators.push(...userOperators)
        }

        const casimirOperators: RegisteredOperator[] = []
        for (const operator of ssvOperators) {
            const { active, collateral, poolCount, resharing } = await (registry as CasimirRegistry).getOperator(operator.id)
            const registered = active || collateral.gt(0) || poolCount.gt(0) || resharing
            if (registered) {
                const pools = await _getPools(operator.id)
                // TODO: Replace these Public Nodes URLs once we have this working again
                const operatorStore = {
                    '208': 'https://nodes.casimir.co/eth/goerli/dkg/1',
                    '209': 'https://nodes.casimir.co/eth/goerli/dkg/2',
                    '210': 'https://nodes.casimir.co/eth/goerli/dkg/3',
                    '211': 'https://nodes.casimir.co/eth/goerli/dkg/4',
                    '212': 'https://nodes.casimir.co/eth/goerli/dkg/5',
                    '213': 'https://nodes.casimir.co/eth/goerli/dkg/6',
                    '214': 'https://nodes.casimir.co/eth/goerli/dkg/7',
                    '215': 'https://nodes.casimir.co/eth/goerli/dkg/8'
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

    async function _getPools(operatorId: number): Promise<PoolConfig[]> {
        const pools: PoolConfig[] = []
    
        const poolIds = [
            ...await (manager as CasimirManager).getPendingPoolIds(),
            ...await (manager as CasimirManager).getStakedPoolIds()
        ]
    
        for (const poolId of poolIds) {
            const poolConfig = await (views as CasimirViews).getPoolConfig(poolId)
            const pool = {
                ...poolConfig,
                operatorIds: poolConfig.operatorIds.map(id => id.toNumber()),
                reshares: poolConfig.reshares.toNumber()
            }
            if (pool.operatorIds.includes(operatorId)) {
                pools.push(pool)
            }
        }
        return pools
    }

    async function initializeComposable(user: UserWithAccountsAndOperators){
        try {
            /* Contracts */
            const factoryAddress = import.meta.env.PUBLIC_FACTORY_ADDRESS
            if (!factoryAddress) throw new Error('No manager address provided')
            const factory = new ethers.Contract(factoryAddress, ICasimirFactoryAbi, provider) as CasimirFactory
            const managerConfigs = ref<ManagerConfig[]>([])
            managerConfigs.value = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
                return await factory.getManagerConfig(id)
            }))
            manager = new ethers.Contract(managerConfigs.value[0].managerAddress, ICasimirManagerAbi, provider) as CasimirManager
            registry = new ethers.Contract(managerConfigs.value[0].registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry
            views = new ethers.Contract(managerConfigs.value[0].viewsAddress, ICasimirViewsAbi, provider) as CasimirViews

            loadingInitializeOperators.value = true
            listenForContractEvents(user)
            await getUserOperators(user)
            loadingInitializeOperators.value = false
        } catch (error) {
            loadingInitializeOperatorsError.value = true
            console.log('Error initializing operators :>> ', error)
            loadingInitializeOperators.value = false
        }
    }

    function listenForContractEvents(user: UserWithAccountsAndOperators) {
        try {
            (registry as CasimirRegistry).on('OperatorRegistered', () => getUserOperators(user))
            // (registry as CasimirRegistry).on('OperatorDeregistered', getUserOperators)
            // (registry as CasimirRegistry).on('DeregistrationRequested', getUserOperators)
        } catch (err) {
            console.log(`There was an error in listenForContractEvents: ${err}`)
        }
    }

    // TODO: Move this to operators.ts to combine with AddOperator method
    async function registerOperatorWithCasimir({ walletProvider, address, operatorId, collateral, nodeUrl }: RegisterOperatorWithCasimirParams) {
        loadingRegisteredOperators.value = true
        try {
            let signer
            if (ethersProviderList.includes(walletProvider)) {
                signer = getEthersBrowserSigner(walletProvider)
            } else if (walletProvider === 'WalletConnect') {
                await getWalletConnectSignerV2()
            } else if (walletProvider === 'Ledger') {
                getEthersLedgerSigner()
            } else if (walletProvider === 'Trezor') {
                getEthersTrezorSigner()
            } else {
                throw new Error(`Invalid wallet provider: ${walletProvider}`)
            }
            const result = await (registry as CasimirRegistry).connect(signer as ethers.Signer).registerOperator(operatorId, { from: address, value: ethers.utils.parseEther(collateral)})
            // TODO: @shanejearley - How many confirmations do we want to wait?
            await result?.wait(1)
            await addOperator({address, nodeUrl})
            loadingRegisteredOperators.value = false
        } catch (err) {
            loadingRegisteredOperatorsError.value = true
            console.error(`There was an error in registerOperatorWithCasimir function: ${JSON.stringify(err)}`)
            loadingRegisteredOperators.value = false
        }
    }

    return { 
        nonregisteredOperators: readonly(nonregisteredOperators),
        registeredOperators: readonly(registeredOperators),
        loadingAddOperator: readonly(loadingAddOperator),
        loadingAddOperatorError: readonly(loadingAddOperatorError),
        loadingInitializeOperators: readonly(loadingInitializeOperators),
        loadingInitializeOperatorsError: readonly(loadingInitializeOperatorsError),
        initializeComposable,
        registerOperatorWithCasimir,
    }
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

// async function _querySSVOperators(address: string) {
//     try {
//         const network = 'prater'
//         const url = `https://api.ssv.network/api/v4/${network}/operators/owned_by/${address}`
//         const response = await fetch(url)
//         const { operators } = await response.json()
//         return operators
//     } catch (err) {
//         console.error(`There was an error in _querySSVOperators function: ${JSON.stringify(err)}`)
//         return []
//     }
// }