import { ContractConfig } from './ContractConfig'

export interface DeploymentConfig {
    CasimirManager: ContractConfig
    MockAggregator?: ContractConfig
}