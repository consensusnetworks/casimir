import { readonly, ref } from 'vue'
import { Operator, Scanner } from '@casimir/ssv'
import { Account, RegisteredOperator, RegisterOperatorWithCasimirParams, UserWithAccountsAndOperators } from '@casimir/types'
import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'
import { CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'

const { ethereumUrl, provider, factory, ssvNetworkAddress, ssvViewsAddress, usersUrl } = useEnvironment()
const { ethersProviderList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const loadingInitializeOperators = ref(false)
const loadingInitializeOperatorsError = ref(false)

const managerConfigs = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
    return await factory.getManagerConfig(id)
}))
const manager = new ethers.Contract(managerConfigs[0].managerAddress, ICasimirManagerAbi, provider) as CasimirManager
const registry = new ethers.Contract(managerConfigs[0].registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry
const views = new ethers.Contract(managerConfigs[0].viewsAddress, ICasimirViewsAbi, provider) as CasimirViews

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
            const { active, collateral, poolCount, resharing } = await registry.getOperator(operator.id)
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

    async function _getPools(operatorId: number): Promise<Pool[]> {
        const pools: Pool[] = []
    
        const poolIds = [
            ...await manager.getPendingPoolIds(),
            ...await manager.getStakedPoolIds()
        ]
    
        for (const poolId of poolIds) {
            const poolConfig = await views.getPoolConfig(poolId)
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
            registry.on('OperatorRegistered', () => getUserOperators(user))
            // registry.on('OperatorDeregistered', getUserOperators)
            // registry.on('DeregistrationRequested', getUserOperators)
        } catch (err) {
            console.log(`There was an error in listenForContractEvents: ${err}`)
        }
    }

    // TODO: Move this to operators.ts to combine with AddOperator method
    async function registerOperatorWithCasimir({ walletProvider, address, operatorId, collateral, nodeUrl }: RegisterOperatorWithCasimirParams) {
        loadingRegisteredOperators.value = true
        try {
            const signerCreators = {
                'Browser': getEthersBrowserSigner,
                'Ledger': getEthersLedgerSigner,
                'Trezor': getEthersTrezorSigner
            }
            const signerType = ethersProviderList.includes(walletProvider) ? 'Browser' : walletProvider
            const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
            let signer
            if (walletProvider === 'WalletConnect') {
                // signer = nonReactiveWalletConnectWeb3Provider
            } else {
                signer = signerCreator(walletProvider)
            }
            const result = await registry.connect(signer as ethers.Signer).registerOperator(operatorId, { from: address, value: ethers.utils.parseEther(collateral)})
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