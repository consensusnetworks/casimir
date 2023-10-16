import { ethers } from 'ethers'
import { CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'
import CasimirManagerAbi from '@casimir/ethereum/build/abi/CasimirManager.json'
import CasimirRegistryAbi from '@casimir/ethereum/build/abi/CasimirRegistry.json'
import CasimirViewsAbi from '@casimir/ethereum/build/abi/CasimirViews.json'

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
const managerAddress = import.meta.env.PUBLIC_MANAGER_ADDRESS
if (!managerAddress) throw new Error('No manager address provided')
const viewsAddress = import.meta.env.PUBLIC_VIEWS_ADDRESS
if (!viewsAddress) throw new Error('No views address provided')
const registryAddress = import.meta.env.PUBLIC_REGISTRY_ADDRESS
if (!registryAddress) throw new Error('No registry address provided')
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
const manager: CasimirManager & ethers.Contract = new ethers.Contract(managerAddress, CasimirManagerAbi, provider) as CasimirManager
const views: CasimirViews & ethers.Contract = new ethers.Contract(viewsAddress, CasimirViewsAbi, provider) as CasimirViews
const registry: CasimirRegistry & ethers.Contract = new ethers.Contract(registryAddress, CasimirRegistryAbi, provider) as CasimirRegistry

export default function useEnvironment() {
    return {
        domain,
        cryptoCompareApiKey,
        ethereumUrl,
        manager,
        provider,
        origin,
        ledgerType,
        managerAddress,
        registryAddress,
        registry,
        speculosUrl,
        ssvNetworkAddress,
        ssvViewsAddress,
        usersUrl,
        views,
        viewsAddress,
        walletConnectProjectId
    }
}