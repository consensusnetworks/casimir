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
        const [baseManagerConfig, eigenManagerConfig] = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
            return await factory.getManagerConfig(id)
        }))

        const baseManager = new ethers.Contract(baseManagerConfig.managerAddress, ICasimirManagerAbi, provider) as CasimirManager
        const baseRegistry = new ethers.Contract(baseManagerConfig.registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry
        const baseViews = new ethers.Contract(baseManagerConfig.viewsAddress, ICasimirViewsAbi, provider) as CasimirViews

        const eigenManager = new ethers.Contract(eigenManagerConfig?.managerAddress || ethers.constants.AddressZero, ICasimirManagerAbi, provider) as CasimirManager
        const eigenRegistry = new ethers.Contract(eigenManagerConfig?.registryAddress || ethers.constants.AddressZero, ICasimirRegistryAbi, provider) as CasimirRegistry
        const eigenViews = new ethers.Contract(eigenManagerConfig?.viewsAddress || ethers.constants.AddressZero, ICasimirViewsAbi, provider) as CasimirViews

        return {
            baseManager,
            baseRegistry,
            baseViews,
            eigenManager,
            eigenRegistry,
            eigenViews
        }
    }

    return {
        getContracts
    }
}