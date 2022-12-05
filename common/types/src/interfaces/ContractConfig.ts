export interface ContractConfig {
    address: string | undefined
    args: {
        [key: string]: string | undefined
    },
    options: {
        initializer?: boolean
    },
    proxy: boolean
}