import { ethers } from 'ethers'
import { CasimirFactory } from '@casimir/ethereum/build/@types'
import ICasimirFactoryAbi from '@casimir/ethereum/build/abi/ICasimirFactory.json'

/* Browser environment */
const domain = window.location.host
const origin = window.location.origin

/* Ethereum environment */
const ethereumUrl = import.meta.env.PUBLIC_ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)

/* Casimir environment */
const usersUrl = import.meta.env.PUBLIC_USERS_URL || 'http://localhost:4000'
const walletConnectProjectId = import.meta.env.PUBLIC_WALLET_CONNECT_PROJECT_ID

/** Network */
const requiredNetwork: '1' | '5' = origin.includes('localhost') ? '5' : origin.includes('app.dev') ? '5' : '1'

/* Addresses */
const factoryAddress = import.meta.env.PUBLIC_FACTORY_ADDRESS
const factory = new ethers.Contract(factoryAddress, ICasimirFactoryAbi, provider) as CasimirFactory
const ssvNetworkAddress = import.meta.env.PUBLIC_SSV_NETWORK_ADDRESS
const ssvViewsAddress = import.meta.env.PUBLIC_SSV_VIEWS_ADDRESS

/* API Keys */
const cryptoCompareApiKey = import.meta.env.PUBLIC_CRYPTO_COMPARE_API_KEY || ''

/* Emulators */
const ledgerType = import.meta.env.PUBLIC_SPECULOS_URL ? 'speculos' : 'usb'
const speculosUrl = import.meta.env.PUBLIC_SPECULOS_URL ? 'http://localhost:5001' : ''

export default function useEnvironment() {

    return {
        domain,
        cryptoCompareApiKey,
        ethereumUrl,
        factory,
        provider,
        origin,
        ledgerType,
        requiredNetwork,
        speculosUrl,
        ssvNetworkAddress,
        ssvViewsAddress,
        usersUrl,
        walletConnectProjectId
    }
}