import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager, CasimirUpkeep, MockFunctionsOracle } from '../build/artifacts/types'

export async function runUpkeep({
    upkeep, chainlink
}: {
    upkeep: CasimirUpkeep, chainlink: SignerWithAddress
}) {
    let ranUpkeep = false
    const checkData = ethers.utils.toUtf8Bytes('')
    const { ...check } = await upkeep.connect(chainlink).checkUpkeep(checkData)
    const { upkeepNeeded, performData } = check
    if (upkeepNeeded) {
        const performUpkeep = await upkeep.connect(chainlink).performUpkeep(performData)
        await performUpkeep.wait()
        ranUpkeep = true
    }
    return ranUpkeep
}

export async function fulfillOracleAnswer({
    upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount
}: {
    upkeep: CasimirUpkeep,
    chainlink: SignerWithAddress,
    nextActiveStakeAmount: number,
    nextSweptRewardsAmount: number,
    nextSweptExitsAmount: number,
    nextDepositedCount: number,
    nextExitedCount: number
}) {
    const activeStakeAmount = ethers.utils.parseUnits(nextActiveStakeAmount.toString(), 'gwei').toString()
    const sweptRewardsAmount = ethers.utils.parseUnits(nextSweptRewardsAmount.toString(), 'gwei').toString()
    const sweptExitsAmount = ethers.utils.parseUnits(nextSweptExitsAmount.toString(), 'gwei').toString()
    const depositedCount = nextDepositedCount.toString()
    const exitedCount = nextExitedCount.toString()
    const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [1]))
    const packedResponse = packResponse(
        activeStakeAmount,
        sweptRewardsAmount,
        sweptExitsAmount,
        depositedCount,
        exitedCount
    )
    const responseBytes = ethers.utils.defaultAbiCoder.encode(['uint256'], [packedResponse.toString()])
    const errorBytes = ethers.utils.toUtf8Bytes('')
    const mockFulfillRequest = await upkeep.connect(chainlink).mockFulfillRequest(requestId, responseBytes, errorBytes)
    await mockFulfillRequest.wait()
}

function packResponse(activeStakeAmount: string, sweptRewardsAmount: string, sweptExitsAmount: string, depositedCount: string, exitedCount: string) {
    let packed = ethers.BigNumber.from(activeStakeAmount)
    packed = packed.or(ethers.BigNumber.from(sweptRewardsAmount).shl(64))
    packed = packed.or(ethers.BigNumber.from(sweptExitsAmount).shl(128))
    packed = packed.or(ethers.BigNumber.from(depositedCount).shl(192))
    packed = packed.or(ethers.BigNumber.from(exitedCount).shl(224))
    return packed
  }