import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirUpkeep } from '../build/artifacts/types'

export async function runUpkeep({
    upkeep, keeper
}: {
    upkeep: CasimirUpkeep, keeper: SignerWithAddress
}) {
    let ranUpkeep = false
    const checkData = ethers.utils.toUtf8Bytes('')
    const { ...check } = await upkeep.connect(keeper).checkUpkeep(checkData)
    const { upkeepNeeded, performData } = check
    if (upkeepNeeded) {
        const performUpkeep = await upkeep.connect(keeper).performUpkeep(performData)
        await performUpkeep.wait()
        ranUpkeep = true
    }
    return ranUpkeep
}

export async function fulfillFunctionsRequest({
    upkeep, keeper, nextActiveBalanceAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount
}: {
    upkeep: CasimirUpkeep,
    keeper: SignerWithAddress,
    nextActiveBalanceAmount: number,
    nextSweptRewardsAmount: number,
    nextSweptExitsAmount: number,
    nextDepositedCount: number,
    nextExitedCount: number
}) {
    const activeBalanceAmount = ethers.utils.parseUnits(nextActiveBalanceAmount.toString(), 'gwei').toString()
    const sweptRewardsAmount = ethers.utils.parseUnits(nextSweptRewardsAmount.toString(), 'gwei').toString()
    const sweptExitsAmount = ethers.utils.parseUnits(nextSweptExitsAmount.toString(), 'gwei').toString()
    const depositedCount = nextDepositedCount.toString()
    const exitedCount = nextExitedCount.toString()
    const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [1]))
    const packedResponse = packResponse(
        activeBalanceAmount,
        sweptRewardsAmount,
        sweptExitsAmount,
        depositedCount,
        exitedCount
    )
    const responseBytes = ethers.utils.defaultAbiCoder.encode(['uint256'], [packedResponse.toString()])
    const errorBytes = ethers.utils.toUtf8Bytes('')
    const mockFulfillRequest = await upkeep.connect(keeper).mockFulfillRequest(requestId, responseBytes, errorBytes)
    await mockFulfillRequest.wait()
}

function packResponse(activeBalanceAmount: string, sweptRewardsAmount: string, sweptExitsAmount: string, depositedCount: string, exitedCount: string) {
    let packed = ethers.BigNumber.from(activeBalanceAmount)
    packed = packed.or(ethers.BigNumber.from(sweptRewardsAmount).shl(64))
    packed = packed.or(ethers.BigNumber.from(sweptExitsAmount).shl(128))
    packed = packed.or(ethers.BigNumber.from(depositedCount).shl(192))
    packed = packed.or(ethers.BigNumber.from(exitedCount).shl(224))
    return packed
}