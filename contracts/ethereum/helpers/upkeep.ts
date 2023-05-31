import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirUpkeep } from '../build/artifacts/types'

export interface ReportValues {
    activeBalance: number
    activatedDeposits: number
    unexpectedExits: number
    slashedExits: number
    withdrawnExits: number
}

export async function fulfillReportRequest({
    upkeep,
    keeper,
    requestId,
    values
}: { 
    upkeep: CasimirUpkeep,
    keeper: SignerWithAddress,
    requestId: number,
    values: ReportValues
}) {    
    requestId++
    const requestIdHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [requestId]))
    const { activeBalance, activatedDeposits, unexpectedExits, slashedExits, withdrawnExits } = values
    const activeBalanceGwei = ethers.utils.parseUnits(activeBalance.toString(), 'gwei')
    const responseBytes = ethers.utils.defaultAbiCoder.encode(
        ['uint128', 'uint32', 'uint32', 'uint32', 'uint32'],
        [activeBalanceGwei, activatedDeposits, unexpectedExits, slashedExits, withdrawnExits]
    )
    await fulfillFunctionsRequest({
        upkeep,
        keeper,
        requestIdHash,
        responseBytes
    })
    return requestId
}

export async function runUpkeep({
    upkeep, keeper
}: {
    upkeep: CasimirUpkeep, keeper: SignerWithAddress
}) {
    let ranUpkeep = false
    const checkData = ethers.utils.toUtf8Bytes('')
    const { ...check } = await upkeep.connect(keeper).checkUpkeep(checkData)
    const { upkeepNeeded } = check
    if (upkeepNeeded) {
        const performData = ethers.utils.toUtf8Bytes('')
        const performUpkeep = await upkeep.connect(keeper).performUpkeep(performData)
        await performUpkeep.wait()
        ranUpkeep = true
    }
    return ranUpkeep
}

export async function fulfillFunctionsRequest({
    upkeep, 
    keeper, 
    requestIdHash,
    responseBytes
}: {
    upkeep: CasimirUpkeep,
    keeper: SignerWithAddress,
    requestIdHash: string,
    responseBytes: string
}) {
    const mockFulfillRequest = await upkeep.connect(keeper).mockFulfillRequest(requestIdHash, responseBytes, [])
    await mockFulfillRequest.wait()
}
