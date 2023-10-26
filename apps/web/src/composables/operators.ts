import { readonly, ref } from 'vue'
import { Operator, Scanner } from '@casimir/ssv'
import { Account, PoolConfig, RegisteredOperator, RegisterOperatorWithCasimirParams } from '@casimir/types'
import { ethers } from 'ethers'
import useContracts from '@/composables/contracts'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useUser from '@/composables/user'
import useWallets from '@/composables/wallets'
import useWalletConnectV2 from '@/composables/walletConnectV2'
import { CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'

let defaultManager: CasimirManager
let defaultRegistry: CasimirRegistry
let defaultViews: CasimirViews

let eigenManager: CasimirManager
let eigenRegistry: CasimirRegistry
let eigenViews: CasimirViews

const { getContracts } = useContracts()
const { ethereumUrl, ssvNetworkAddress, ssvViewsAddress, usersUrl } = useEnvironment()
const { browserProvidersList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { user } = useUser()
const { detectActiveNetwork, switchEthersNetwork } = useWallets()
const { getWalletConnectSignerV2 } = useWalletConnectV2()
const loadingInitializeOperators = ref(false)
const loadingInitializeOperatorsError = ref(false)

export default function useOperators() {
    const loadingAddOperator = ref(false)
    const loadingAddOperatorError = ref(false)
    const loadingRegisteredOperators = ref(false)
    const loadingRegisteredOperatorsError = ref(false)

    const nonregisteredDefaultOperators = ref<Operator[]>([])
    const nonregisteredEigenOperators = ref<Operator[]>([])
    const registeredDefaultOperators = ref<Operator[]>([])
    const registeredEigenOperators = ref<Operator[]>([])

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

    async function getUserOperators(): Promise<void> {
        const userAddresses = user.value?.accounts.map((account: Account) => account.address) as string[]
        
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

        const defaultCasimirOperators = await _getRegisteredOperators(ssvOperators, 'default')
        const eigenCasimirOperators = await _getRegisteredOperators(ssvOperators, 'eigen')
        
        const nonregDefaultOperators = ssvOperators.filter((operator: any) => {
            const idRegistered = defaultCasimirOperators.find((registeredOperator: any) => registeredOperator.id === operator.id)
            return !idRegistered
        })
        const nonregEigenOperators = ssvOperators.filter((operator: any) => {
            const idRegistered = eigenCasimirOperators.find((registeredOperator: any) => registeredOperator.id === operator.id)
            return !idRegistered
        })

        nonregisteredDefaultOperators.value = nonregDefaultOperators as Array<Operator>
        nonregisteredEigenOperators.value = nonregEigenOperators as Array<Operator>
        registeredDefaultOperators.value = defaultCasimirOperators as Array<RegisteredOperator>
        registeredEigenOperators.value = eigenCasimirOperators as Array<RegisteredOperator>
    }

    async function _getRegisteredOperators(ssvOperators: Operator[], type: 'default' | 'eigen'): Promise<RegisteredOperator[]> {
        const casimirOperators: RegisteredOperator[] = []
        const registry = type === 'default' ? defaultRegistry : eigenRegistry
        for (const operator of ssvOperators) {
            const { active, collateral, poolCount, resharing } = await (registry as CasimirRegistry).getOperator(operator.id)
            const registered = active || collateral.gt(0) || poolCount.gt(0) || resharing
            if (registered) {
                const pools = await _getPools(operator.id, type)
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
        return casimirOperators
    }

    async function _getPools(operatorId: number, type: 'default' | 'eigen'): Promise<PoolConfig[]> {
        const pools: PoolConfig[] = []
    
        const defaultPoolIds = [
            ...await (defaultManager as CasimirManager).getPendingPoolIds(),
            ...await (defaultManager as CasimirManager).getStakedPoolIds()
        ]
        const eigenPoolIds = [
            ...await (eigenManager as CasimirManager).getPendingPoolIds(),
            ...await (eigenManager as CasimirManager).getStakedPoolIds()
        ]

        const poolIds = type === 'default' ? defaultPoolIds : eigenPoolIds
        const views = type === 'default' ? defaultViews : eigenViews
    
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

    async function initializeOperatorComposable(){
        try {
            /* Get Manager, Views, and Registry */
            const { defaultManager: managerContract, defaultRegistry: registryContract, defaultViews: viewsContract } = await getContracts()
            const { eigenManager: eigenManagerContract, eigenRegistry: eigenRegistryContract, eigenViews: eigenViewsContract } = await getContracts()
            defaultManager = managerContract
            defaultRegistry = registryContract
            defaultViews = viewsContract
            eigenManager = eigenManagerContract
            eigenRegistry = eigenRegistryContract
            eigenViews = eigenViewsContract

            loadingInitializeOperators.value = true
            listenForContractEvents()
            await getUserOperators()
            loadingInitializeOperators.value = false
        } catch (error) {
            loadingInitializeOperatorsError.value = true
            console.log('Error initializing operators :>> ', error)
            loadingInitializeOperators.value = false
        }
    }

    function listenForContractEvents() {
        try {
            (defaultRegistry as CasimirRegistry).on('OperatorRegistered', () => getUserOperators());
            (eigenRegistry as CasimirRegistry).on('OperatorRegistered', () => getUserOperators())

            // (registry as CasimirRegistry).on('OperatorDeregistered', getUserOperators)
            // (registry as CasimirRegistry).on('DeregistrationRequested', getUserOperators)
        } catch (err) {
            console.log(`There was an error in listenForContractEvents: ${err}`)
        }
    }

    // TODO: Move this to operators.ts to combine with AddOperator method
    async function registerOperatorWithCasimir({ walletProvider, address, operatorId, collateral, nodeUrl }: RegisterOperatorWithCasimirParams) {
        const activeNetwork = await detectActiveNetwork(walletProvider)
        if (activeNetwork !== 5) {
            await switchEthersNetwork(walletProvider, '0x5')
            return window.location.reload()
        }
        loadingRegisteredOperators.value = true
        try {
            let signer
            if (browserProvidersList.includes(walletProvider)) {
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
            const result = await (defaultRegistry as CasimirRegistry).connect(signer as ethers.Signer).registerOperator(operatorId, { from: address, value: ethers.utils.parseEther(collateral)})
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
        nonregisteredDefaultOperators: readonly(nonregisteredDefaultOperators),
        nonregisteredEigenOperators: readonly(nonregisteredEigenOperators),
        registeredDefaultOperators: readonly(registeredDefaultOperators),
        registeredEigenOperators: readonly(registeredEigenOperators),
        loadingAddOperator: readonly(loadingAddOperator),
        loadingAddOperatorError: readonly(loadingAddOperatorError),
        loadingInitializeOperators: readonly(loadingInitializeOperators),
        loadingInitializeOperatorsError: readonly(loadingInitializeOperatorsError),
        initializeOperatorComposable,
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