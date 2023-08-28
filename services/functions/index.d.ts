declare module '@casimir/functions' {
    export const requestConfig: {
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
}