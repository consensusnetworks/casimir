import { readonly, ref, watchEffect, watch } from 'vue'
import useEnvironment from '@/composables/environment'
import useContracts from '@/composables/contracts'
// import useUser from '@/composables/user'
import { Operator, Scanner } from '@casimir/ssv'
import { RegisteredOperator, Pool, Account, UserWithAccountsAndOperators } from '@casimir/types'
import { ethers } from 'ethers'

export default function useOperators() {
    // const { user } = useUser()
    const { ethereumUrl, ssvNetworkAddress, ssvViewsAddress, usersUrl } = useEnvironment()
    const { manager, registry, views } = useContracts()


    const nonregisteredOperators = ref<Operator[]>([])
    const registeredOperators = ref<Operator[]>([])

    async function addOperator({ address, nodeUrl }: { address: string, nodeUrl: string }) {
        try {
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address, nodeUrl })
            }
            const response = await fetch(`${usersUrl}/user/add-operator`, requestOptions)
            const { error, message } = await response.json()
            return { error, message }
        } catch (error: any) {
            throw new Error(error.message || 'Error adding operator')
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
                    '654': 'https://nodes.casimir.co/eth/goerli/dkg/1',
                    '655': 'https://nodes.casimir.co/eth/goerli/dkg/2',
                    '656': 'https://nodes.casimir.co/eth/goerli/dkg/3',
                    '657': 'https://nodes.casimir.co/eth/goerli/dkg/4',
                    '156': 'https://nodes.casimir.co/eth/goerli/dkg/5',
                    '157': 'https://nodes.casimir.co/eth/goerli/dkg/6',
                    '158': 'https://nodes.casimir.co/eth/goerli/dkg/7',
                    '159': 'https://nodes.casimir.co/eth/goerli/dkg/8'
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


    function listenForContractEvents() {
        try {
            registry.on('OperatorRegistered', getUserOperators)
            // registry.on('OperatorDeregistered', getUserOperators)
            // registry.on('DeregistrationRequested', getUserOperators)
        } catch (err) {
            console.log(`There was an error in listenForContractEvents: ${err}`)
        }
    }

    async function initializeComposable(user: UserWithAccountsAndOperators){
        listenForContractEvents()
        await getUserOperators(user)
    }
    watchEffect( () => {
        // 
    })

    return { 
        nonregisteredOperators: readonly(nonregisteredOperators),
        registeredOperators: readonly(registeredOperators),
        addOperator,
        initializeComposable
    }
}