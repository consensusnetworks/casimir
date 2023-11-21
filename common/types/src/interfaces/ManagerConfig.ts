import { ethers } from "ethers"

export type ManagerConfig = {
    managerAddress: string
    registryAddress: string
    upkeepAddress: string
    viewsAddress: string
    strategy: {
        minCollateral: ethers.BigNumber
        lockPeriod: ethers.BigNumber
        userFee: number
        compoundStake: boolean
        eigenStake: boolean
        liquidStake: boolean
        privateOperators: boolean
        verifiedOperators: boolean
    }
}