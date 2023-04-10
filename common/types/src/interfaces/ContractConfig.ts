export interface ContractConfig {
    address: string | undefined
    args: {
        [key: string]: boolean | number | string | undefined
    },
    options: {
        initializer?: boolean
    },
    proxy: boolean
}