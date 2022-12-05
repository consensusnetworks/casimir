import { ContractConfig } from './ContractConfig'

export interface SSVDeploymentConfig {
    SSVManager: ContractConfig
    MockOracle?: ContractConfig,
    LinkToken?: ContractConfig
}