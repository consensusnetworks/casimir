import { ethers } from "ethers"
import { ManagerConfig } from "@casimir/types"

export interface HandlerInput {
    managerConfig: ManagerConfig
    args?: ethers.utils.Result
}