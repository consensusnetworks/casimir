import { ref } from "vue"
import { ethers } from "ethers"
import useEnvironment from "@/composables/environment"
import { CasimirManager, CasimirRegistry, CasimirViews } from "@casimir/ethereum/build/@types"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import ICasimirRegistryAbi from "@casimir/ethereum/build/abi/ICasimirRegistry.json"
import ICasimirViewsAbi from "@casimir/ethereum/build/abi/ICasimirViews.json"

const { wsProvider, provider, factory } = useEnvironment()
const contractsAreInitialized = ref(false)

let baseManager: CasimirManager
let baseRegistry: CasimirRegistry
let baseViews: CasimirViews
let eigenManager: CasimirManager
let eigenRegistry: CasimirRegistry
let eigenViews: CasimirViews

export default function useContracts() {

    async function initializeContractsComposable() {
        if (contractsAreInitialized.value) return
        await getContracts()
    }

    async function getContracts() {
        const [baseManagerConfig, eigenManagerConfig] = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
            return await factory.getManagerConfig(id)
        }))

        const availableProvider = wsProvider || provider

        baseManager = new ethers.Contract(baseManagerConfig.managerAddress, ICasimirManagerAbi, availableProvider) as CasimirManager
        baseRegistry = new ethers.Contract(baseManagerConfig.registryAddress, ICasimirRegistryAbi, availableProvider) as CasimirRegistry
        baseViews = new ethers.Contract(baseManagerConfig.viewsAddress, ICasimirViewsAbi, availableProvider) as CasimirViews

        eigenManager = new ethers.Contract(
            eigenManagerConfig?.managerAddress || ethers.constants.AddressZero, ICasimirManagerAbi, availableProvider
        ) as CasimirManager
        eigenRegistry = new ethers.Contract(
            eigenManagerConfig?.registryAddress || ethers.constants.AddressZero, ICasimirRegistryAbi, availableProvider
        ) as CasimirRegistry
        eigenViews = new ethers.Contract(
            eigenManagerConfig?.viewsAddress || ethers.constants.AddressZero, ICasimirViewsAbi, availableProvider
        ) as CasimirViews

        contractsAreInitialized.value = true
    }

    function getBaseManager() { return baseManager }

    function getEigenManager() { return eigenManager }

    function getBaseRegistry() { return baseRegistry }

    function getEigenRegistry() { return eigenRegistry }

    function getBaseViews() { return baseViews }

    function getEigenViews() { return eigenViews }

    return {
        contractsAreInitialized,
        initializeContractsComposable,
        getBaseManager,
        getEigenManager,
        getBaseRegistry,
        getEigenRegistry,
        getBaseViews,
        getEigenViews,
    }
}