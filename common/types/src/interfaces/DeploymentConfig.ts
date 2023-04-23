import { ContractConfig } from './ContractConfig'

export interface DeploymentConfig {
    CasimirManager: ContractConfig
    MockFunctionsOracle?: ContractConfig
    MockKeeperRegistry?: ContractConfig
}