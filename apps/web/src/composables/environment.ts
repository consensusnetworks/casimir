export default function useEnvironment() {
    const domain = window.location.host
    const origin = window.location.origin
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
        if (import.meta.env.PUBLIC_USERS_PORT) {
            return `http://localhost:${import.meta.env.PUBLIC_USERS_PORT}`
        } else {
            const stage = import.meta.env.PUBLIC_STAGE
            const subdomain = stage === 'prod' ? '' : `${stage}.`
            return `https://users.${subdomain}casimir.co`
        }
    }
    return {
        domain,
        origin,
        usersBaseURL,
        ethereumURL,
        ledgerType,
        speculosURL,
        walletConnectURL,
    }
}