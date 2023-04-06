export interface ContractConfig {
    address: string | undefined
    args: {
        [key: string]: string | boolean | undefined
    },
    options: {
        initializer?: boolean
    },
    proxy: boolean
}