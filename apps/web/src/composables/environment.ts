import { onMounted, ref } from 'vue'
import { ethers } from 'ethers'
import { CasimirFactory, CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'
import ICasimirFactoryAbi from '@casimir/ethereum/build/abi/ICasimirFactory.json'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'

const domain = window.location.host
const origin = window.location.origin
const usersUrl = import.meta.env.PUBLIC_USERS_URL || 'http://localhost:4000'
const ethereumUrl = import.meta.env.PUBLIC_ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'
const ledgerType = import.meta.env.PUBLIC_SPECULOS_URL ? 'speculos' : 'usb'
const speculosUrl = import.meta.env.PUBLIC_SPECULOS_URL ? 'http://localhost:5001' : ''
const cryptoCompareApiKey = import.meta.env.PUBLIC_CRYPTO_COMPARE_API_KEY || ''
const ssvNetworkAddress = import.meta.env.PUBLIC_SSV_NETWORK_ADDRESS
const ssvViewsAddress = import.meta.env.PUBLIC_SSV_VIEWS_ADDRESS
const walletConnectProjectId = import.meta.env.PUBLIC_WALLET_CONNECT_PROJECT_ID

/* Contracts */
type ManagerConfig = {
    managerAddress: string;
    registryAddress: string;
    viewsAddress: string;
};
const factoryAddress = import.meta.env.PUBLIC_FACTORY_ADDRESS
if (!factoryAddress) throw new Error('No manager address provided')
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
const factory = new ethers.Contract(factoryAddress, ICasimirFactoryAbi, provider) as CasimirFactory
const managerConfigs = ref<ManagerConfig[]>([])
const manager = ref<CasimirManager>()
const registry = ref<CasimirRegistry>()
const views = ref<CasimirViews>()

export default function useEnvironment() {

    onMounted(async () => {
        managerConfigs.value = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
            return await factory.getManagerConfig(id)
        }))

        manager.value = new ethers.Contract(managerConfigs.value[0].managerAddress, ICasimirManagerAbi, provider) as CasimirManager
        registry.value = new ethers.Contract(managerConfigs.value[0].registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry
        views.value = new ethers.Contract(managerConfigs.value[0].viewsAddress, ICasimirViewsAbi, provider) as CasimirViews
    })

    return {
        domain,
        cryptoCompareApiKey,
        ethereumUrl,
        factory,
        manager,
        registry,
        views,
        provider,
        origin,
        ledgerType,
        speculosUrl,
        ssvNetworkAddress,
        ssvViewsAddress,
        usersUrl,
        walletConnectProjectId
    }
}