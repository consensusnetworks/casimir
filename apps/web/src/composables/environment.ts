export default function useEnvironment() {
    const ethereumURL = import.meta.env.PUBLIC_ETHEREUM_RPC || 'http://127.0.0.1:8545/'
    const ledgerType = import.meta.env.PUBLIC_SPECULOS_PORT ? 'speculos' : 'usb'
    const speculosURL = import.meta.env.PUBLIC_SPECULOS_PORT ? `http://127.0.0.1:${import.meta.env.PUBLIC_SPECULOS_PORT}` : undefined
    return {
        ethereumURL,
        ledgerType,
        speculosURL
    }
}