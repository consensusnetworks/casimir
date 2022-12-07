import { ContractConfig } from './ContractConfig'

export interface SSVDeploymentConfig {
    SSVManager: ContractConfig
    Oracle?: ContractConfig,
    MockOracle?: ContractConfig
}