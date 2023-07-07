export default function useEnvironment() {
    const domain = window.location.host
    const origin = window.location.origin
    const managerAddress = import.meta.env.PUBLIC_MANAGER_ADDRESS || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
    const viewsAddress = import.meta.env.PUBLIC_VIEWS_ADDRESS || '0x6b34d231b467fccebdc766187f7251795281dc26'
    const usersUrl = import.meta.env.PUBLIC_USERS_URL || 'http://localhost:4000'
    const ethereumUrl = import.meta.env.PUBLIC_ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'
    const ledgerType = import.meta.env.PUBLIC_SPECULOS_URL ? 'speculos' : 'usb'
    const speculosUrl = import.meta.env.PUBLIC_SPECULOS_URL ? 'http://localhost:5001' : ''
    const walletConnectUrl = 'https://bridge.walletconnect.org'
    const cryptoCompareApiKey = import.meta.env.PUBLIC_CRYPTO_COMPARE_API_KEY || ''
    
    return {
        domain,
        origin,
        managerAddress,
        viewsAddress,
        usersUrl,
        ethereumUrl,
        ledgerType,
        speculosUrl,
        walletConnectUrl,
        cryptoCompareApiKey
    }
}