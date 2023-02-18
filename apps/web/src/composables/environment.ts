export default function useEnvironment() {
    const usersBaseURL = getUsersBaseURL()
    const ethereumURL = import.meta.env.PUBLIC_ETHEREUM_URL || 'http://127.0.0.1:8545'
    const ledgerType = import.meta.env.PUBLIC_SPECULOS_PORT ? 'speculos' : 'usb'
    const speculosURL = import.meta.env.PUBLIC_SPECULOS_PORT ? `http://127.0.0.1:${import.meta.env.PUBLIC_SPECULOS_PORT}` : undefined
    const walletConnectURL = 'https://bridge.walletconnect.org'
    
    /**
     * Get the users base url for the current environment
     * 
     * @returns {string} The base URL for the users API
     */
    function getUsersBaseURL(): string {
        if (import.meta.env.PUBLIC_AUTH_PORT) {
            return `http://localhost:${import.meta.env.PUBLIC_AUTH_PORT}`
        } else {
            return `https://users.${import.meta.env.PUBLIC_STAGE || 'dev'}.casimir.co`
        }
    }
    return {
        usersBaseURL,
        ethereumURL,
        ledgerType,
        speculosURL,
        walletConnectURL,
    }
}