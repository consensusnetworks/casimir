import { ethers } from "ethers"
import { ManagerConfig } from "@casimir/types"

export interface HandlerInput {
    managerConfigs: ManagerConfig[]
    args?: ethers.utils.Result
}