declare module '@casimir/functions/Functions-request-config' {
    const requestConfig: {
        codeLocation: number
        codeLanguage: number
        source: string
        secrets: Record<string, string>
        perNodeSecrets: string[]
        walletPrivateKey: string
        args: string[]
        expectedReturnType: string
        secretsURLs: never[]
    }
    export default requestConfig
}