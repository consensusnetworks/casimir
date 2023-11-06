import { ContractArgs } from "./ContractArgs"

export interface ContractConfig {
    address: string | undefined
    args: ContractArgs,
    options: {
        initializer?: boolean
    },
    proxy: boolean
}