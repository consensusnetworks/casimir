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
    const walletConnectUrl = 'https://bridge.walletconnect.org'
    const cryptoCompareApiKey = import.meta.env.PUBLIC_CRYPTO_COMPARE_API_KEY || ''
    const ssvNetworkAddress = import.meta.env.PUBLIC_SSV_NETWORK_ADDRESS
    const ssvViewsAddress = import.meta.env.PUBLIC_SSV_VIEWS_ADDRESS
    
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
        ssvViewsAddress,
        usersUrl,
        viewsAddress,
        walletConnectUrl,
    }
}