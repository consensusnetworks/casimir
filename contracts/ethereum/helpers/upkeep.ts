import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirUpkeep } from '../build/artifacts/types'

export interface ReportValues {
    activeBalance: number
    sweptBalance: number
    activatedDeposits: number
    forcedExits: number
    completedExits: number
    compoundablePoolIds: number[]
}

export async function fulfillReport({
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
    const { activeBalance, sweptBalance, activatedDeposits, forcedExits, completedExits, compoundablePoolIds } = values
    
    requestId++
    const balancesRequestIdHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [requestId]))
    const balancesResponseBytes = ethers.utils.defaultAbiCoder.encode(
        ['uint128', 'uint128'],
        [ethers.utils.parseEther(activeBalance.toString()), ethers.utils.parseEther(sweptBalance.toString())]
    )
    await fulfillFunctionsRequest({
        upkeep,
        keeper,
        requestIdHash: balancesRequestIdHash,
        responseBytes: balancesResponseBytes
    })

    requestId++
    const detailsRequestIdHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [requestId]))
    const detailsResponseBytes = ethers.utils.defaultAbiCoder.encode(
        ['uint32', 'uint32', 'uint32', 'uint32[5]'],
        [activatedDeposits, forcedExits, completedExits, compoundablePoolIds]
    )
    await fulfillFunctionsRequest({
        upkeep,
        keeper,
        requestIdHash: detailsRequestIdHash,
        responseBytes: detailsResponseBytes
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
