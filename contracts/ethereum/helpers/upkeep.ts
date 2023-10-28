import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirUpkeep, FunctionsBillingRegistry } from '../build/@types'

export async function runUpkeep({
    donTransmitter, upkeep,
}: {
    donTransmitter: SignerWithAddress,
    upkeep: CasimirUpkeep,
}) {
    let ranUpkeep = false
    const checkData = ethers.utils.toUtf8Bytes('')
    const { ...check } = await upkeep.connect(donTransmitter).checkUpkeep(checkData)
    const { upkeepNeeded } = check
    if (upkeepNeeded) {
        const performData = ethers.utils.toUtf8Bytes('')
        const performUpkeep = await upkeep.connect(donTransmitter).performUpkeep(performData)
        await performUpkeep.wait()
        ranUpkeep = true
    }
    return ranUpkeep
}

export interface ReportValues {
    beaconBalance: number
    sweptBalance: number
    activatedDeposits: number
    forcedExits: number
    completedExits: number
    compoundablePoolIds: number[]
}

export async function fulfillReport({
    donTransmitter,
    upkeep,
    functionsBillingRegistry,
    values
}: {
    donTransmitter: SignerWithAddress,
    upkeep: CasimirUpkeep,
    functionsBillingRegistry: FunctionsBillingRegistry,
    values: ReportValues
}) {
    const { beaconBalance, sweptBalance, activatedDeposits, forcedExits, completedExits, compoundablePoolIds } = values

    const requestIds = (await upkeep.queryFilter(upkeep.filters.RequestSent())).slice(-2).map((event) => event.args.id)
    
    const balancesRequestId = requestIds[0]
    const balancesResponse = ethers.utils.defaultAbiCoder.encode(
        ['uint128', 'uint128'],
        [ethers.utils.parseEther(beaconBalance.toString()), ethers.utils.parseEther(sweptBalance.toString())]
    )
    
    const fulfillBalances = await upkeep.connect(donTransmitter).fulfillRequestDirect(balancesRequestId, balancesResponse, '0x')
    await fulfillBalances.wait()
    // await fulfillFunctionsRequest({
    //     donTransmitter,
    //     functionsBillingRegistry,
    //     requestId: balancesRequestId,
    //     response: balancesResponse
    // })

    const detailsRequestId = requestIds[1]
    const detailsResponse = ethers.utils.defaultAbiCoder.encode(
        ['uint32', 'uint32', 'uint32', 'uint32[5]'],
        [activatedDeposits, forcedExits, completedExits, compoundablePoolIds]
    )

    const fulfillDetails = await upkeep.connect(donTransmitter).fulfillRequestDirect(detailsRequestId, detailsResponse, '0x')
    await fulfillDetails.wait()
    // await fulfillFunctionsRequest({
    //     donTransmitter,
    //     functionsBillingRegistry,
    //     requestId: detailsRequestId,
    //     response: detailsResponse
    // })
}

// export async function fulfillFunctionsRequest({
//     donTransmitter,
//     functionsBillingRegistry,
//     requestId,
//     response
// }: {
//     donTransmitter: SignerWithAddress,
//     functionsBillingRegistry: FunctionsBillingRegistry,
//     requestId: string,
//     response: string
// }) {
//     const dummyTransmitter = donTransmitter.address
//     const dummySigners = Array(31).fill(dummyTransmitter)

//     // const { success, result, resultLog } = await simulateRequest(requestConfig)
    
//     const fulfillAndBill = await functionsBillingRegistry.connect(donTransmitter).fulfillAndBill(
//         requestId,
//         response,
//         '0x',
//         dummyTransmitter,
//         dummySigners,
//         4,
//         100_000,
//         500_000,
//         {
//             gasLimit: 500_000,
//         }
//     )
//     await fulfillAndBill.wait()
// }
