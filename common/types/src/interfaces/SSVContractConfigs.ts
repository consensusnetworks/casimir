import { ContractConfig } from './ContractConfig'

export interface SSVContractConfigs {
    SSVManager: ContractConfig
    MockOracle?: ContractConfig,
    LinkToken?: ContractConfig
}