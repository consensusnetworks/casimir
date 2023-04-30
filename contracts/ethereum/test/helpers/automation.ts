import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager, CasimirAutomation, MockFunctionsOracle } from '../../build/artifacts/types'

export async function runUpkeep(automation: CasimirAutomation, chainlink: SignerWithAddress) {
    let ranUpkeep = false
    const checkData = ethers.utils.toUtf8Bytes('')
    const { ...check } = await automation.connect(chainlink).checkUpkeep(checkData)
    const { upkeepNeeded, performData } = check
    if (upkeepNeeded) {
        const performUpkeep = await automation.connect(chainlink).performUpkeep(performData)
        await performUpkeep.wait()
        ranUpkeep = true
    }
    return ranUpkeep
}

export async function fulfillOracleAnswer(automation: CasimirAutomation, chainlink: SignerWithAddress, nextActiveStakeAmount: number, nextSweptRewardsAmount: number, nextSweptExitsAmount: number) {
    const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [1]))
    const responseBytes = ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'uint256', 'uint256'],
        [
            ethers.utils.parseEther(nextActiveStakeAmount.toString()),
            ethers.utils.parseEther(nextSweptRewardsAmount.toString()),
            ethers.utils.parseEther(nextSweptExitsAmount.toString())
        ]
    )
    const errorBytes = ethers.utils.toUtf8Bytes('')
    const mockFulfillRequest = await automation.connect(chainlink).mockFulfillRequest(requestId, responseBytes, errorBytes)
    await mockFulfillRequest.wait()
}