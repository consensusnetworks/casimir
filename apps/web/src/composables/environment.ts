export default function useEnvironment() {
    const domain = window.location.host
    const origin = window.location.origin
    const managerAddress = import.meta.env.PUBLIC_MANAGER_ADDRESS
    if (!managerAddress) throw new Error('No manager address provided')
    const viewsAddress = import.meta.env.PUBLIC_VIEWS_ADDRESS
    if (!viewsAddress) throw new Error('No views address provided')
    const registryAddress = import.meta.env.PUBLIC_REGISTRY_ADDRESS
    if (!registryAddress) throw new Error('No registry address provided')
    const usersUrl = import.meta.env.PUBLIC_USERS_URL || 'http://localhost:4000'
    const ethereumUrl = import.meta.env.PUBLIC_ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'
    const ledgerType = import.meta.env.PUBLIC_SPECULOS_URL ? 'speculos' : 'usb'
    const speculosUrl = import.meta.env.PUBLIC_SPECULOS_URL ? 'http://localhost:5001' : ''
    const cryptoCompareApiKey = import.meta.env.PUBLIC_CRYPTO_COMPARE_API_KEY || ''
    const ssvNetworkAddress = import.meta.env.PUBLIC_SSV_NETWORK_ADDRESS
    const ssvNetworkViewsAddress = import.meta.env.PUBLIC_SSV_NETWORK_VIEWS_ADDRESS
    const walletConnectProjectId = import.meta.env.PUBLIC_WALLET_CONNECT_PROJECT_ID
    
    return {
        domain,
        cryptoCompareApiKey,
        ethereumUrl,
        origin,
        ledgerType,
        managerAddress,
        registryAddress,
        speculosUrl,
        ssvNetworkAddress,
        ssvNetworkViewsAddress,
        usersUrl,
        viewsAddress,
        walletConnectProjectId
    }
}