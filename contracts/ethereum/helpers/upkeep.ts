import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirUpkeep, FunctionsBillingRegistry } from '../build/@types'

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

export interface ReportValues {
    activeBalance: number
    sweptBalance: number
    activatedDeposits: number
    forcedExits: number
    completedExits: number
    compoundablePoolIds: number[]
}

export async function fulfillReport({
    keeper,
    upkeep,
    functionsBillingRegistry,
    values
}: {
    keeper: SignerWithAddress,
    upkeep: CasimirUpkeep,
    functionsBillingRegistry: FunctionsBillingRegistry,
    values: ReportValues
}) {
    const { activeBalance, sweptBalance, activatedDeposits, forcedExits, completedExits, compoundablePoolIds } = values

    const requestIds = (await upkeep.queryFilter(upkeep.filters.RequestSent())).slice(-2).map((event) => event.args.id)
    
    const balancesRequestId = requestIds[0]
    const balancesResponse = ethers.utils.defaultAbiCoder.encode(
        ['uint128', 'uint128'],
        [ethers.utils.parseEther(activeBalance.toString()), ethers.utils.parseEther(sweptBalance.toString())]
    )
    
    await fulfillFunctionsRequest({
        keeper,
        functionsBillingRegistry,
        requestId: balancesRequestId,
        response: balancesResponse
    })

    const detailsRequestId = requestIds[1]
    const detailsResponse = ethers.utils.defaultAbiCoder.encode(
        ['uint32', 'uint32', 'uint32', 'uint32[5]'],
        [activatedDeposits, forcedExits, completedExits, compoundablePoolIds]
    )

    await fulfillFunctionsRequest({
        keeper,
        functionsBillingRegistry,
        requestId: detailsRequestId,
        response: detailsResponse
    })
}

export async function fulfillFunctionsRequest({
    keeper,
    functionsBillingRegistry,
    requestId,
    response
}: {
    keeper: SignerWithAddress,
    functionsBillingRegistry: FunctionsBillingRegistry,
    requestId: string,
    response: string
}) {
    const dummyTransmitter = keeper.address
    const dummySigners = Array(31).fill(dummyTransmitter)

    // const { success, result, resultLog } = await simulateRequest(requestConfig)
    
    const fulfillAndBill = await functionsBillingRegistry.connect(keeper).fulfillAndBill(
        requestId,
        response,
        '0x',
        dummyTransmitter,
        dummySigners,
        4,
        100_000,
        500_000,
        {
            gasLimit: 500_000,
        }
    )
    await fulfillAndBill.wait()
}
