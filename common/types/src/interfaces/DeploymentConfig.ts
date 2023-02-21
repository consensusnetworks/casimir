import { ContractConfig } from './ContractConfig'

export interface DeploymentConfig {
    SSVManager: ContractConfig
    Oracle?: ContractConfig,
    MockFeed?: ContractConfig
}