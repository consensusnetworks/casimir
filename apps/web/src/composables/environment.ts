export default function useEnvironment() {
    const domain = window.location.host
    const origin = window.location.origin
    const usersUrl = import.meta.env.PUBLIC_USERS_URL || 'http://localhost:4000'
    const ethereumUrl = import.meta.env.PUBLIC_ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'
    const ledgerType = import.meta.env.PUBLIC_SPECULOS_URL ? 'speculos' : 'usb'
    const speculosUrl = import.meta.env.PUBLIC_SPECULOS_URL ? 'http://localhost:5001' : ''
    const walletConnectUrl = 'https://bridge.walletconnect.org'
    const cryptoCompareApiKey = import.meta.env.PUBLIC_CRYPTO_COMPARE_API_KEY || ''
    
    /* Smart Contract Addresses */
    const managerAddress = import.meta.env.PUBLIC_MANAGER_ADDRESS || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
    const registryAddress = import.meta.env.PUBLIC_REGISTRY_ADDRESS || '0x40A9DEB9Eb871e3f7A1a2946a6e8A84afAb4C598'
    const ssvNetworkAddress = import.meta.env.PUBLIC_SSV_NETWORK_ADDRESS
    const ssvNetworkViewsAddress = import.meta.env.PUBLIC_SSV_NETWORK_VIEWS_ADDRESS
    const viewsAddress = import.meta.env.PUBLIC_VIEWS_ADDRESS || '0x6b34d231b467fccebdc766187f7251795281dc26'
    
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
        walletConnectUrl,
    }
}