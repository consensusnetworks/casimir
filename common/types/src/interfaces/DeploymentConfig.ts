import { ContractConfig } from "./ContractConfig"

export interface DeploymentConfig {
    CasimirManager: ContractConfig
    CasimirViews: ContractConfig
    MockFunctionsOracle?: ContractConfig
}