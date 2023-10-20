import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import { ManagerConfig } from '@casimir/types'
import { CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'

const { provider, factory } = useEnvironment()

export default function useContracts() {
    async function getContracts() {
        const managerConfigs: ManagerConfig[] = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
            return await factory.getManagerConfig(id)
        }))
        const manager = new ethers.Contract(managerConfigs[0].managerAddress, ICasimirManagerAbi, provider) as CasimirManager
        const registry = new ethers.Contract(managerConfigs[0].registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry
        const views = new ethers.Contract(managerConfigs[0].viewsAddress, ICasimirViewsAbi, provider) as CasimirViews

        return {
            manager,
            registry,
            views
        }
    }

    return {
        getContracts
    }
}