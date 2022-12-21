export default function useEnvironment() {
    const authBaseURL = _getAuthBaseURL()
    const ethereumURL = import.meta.env.PUBLIC_ETHEREUM_URL || 'http://127.0.0.1:8545'
    const ledgerType = import.meta.env.PUBLIC_SPECULOS_PORT ? 'speculos' : 'usb'
    const speculosURL = import.meta.env.PUBLIC_SPECULOS_PORT ? `http://127.0.0.1:${import.meta.env.PUBLIC_SPECULOS_PORT}` : undefined
    const walletConnectURL = 'https://bridge.walletconnect.org'
    
    /**
     * Get the auth base url for the current environment
     * 
     * @returns {string} The base URL for the auth API
     */
    function _getAuthBaseURL(): string {
        if (import.meta.env.PUBLIC_AUTH_PORT) {
            return `http://localhost:${import.meta.env.PUBLIC_AUTH_PORT}`
        } else {
            return `https://auth.${import.meta.env.PUBLIC_STAGE || 'dev'}.casimir.co`
        }
    }
    return {
        authBaseURL,
        ethereumURL,
        ledgerType,
        speculosURL,
        walletConnectURL,
    }
}