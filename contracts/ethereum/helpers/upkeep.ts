import { ethers } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { CasimirUpkeep, FunctionsBillingRegistry } from "../build/@types"

export async function runUpkeep({
    donTransmitter, 
    upkeep,
}: {
    donTransmitter: SignerWithAddress,
    upkeep: CasimirUpkeep,
}) {
    let ranUpkeep = false
    const checkData = ethers.utils.toUtf8Bytes("0x")
    const { ...check } = await upkeep.connect(donTransmitter).checkUpkeep(checkData)
    const { upkeepNeeded } = check
    if (upkeepNeeded) {
        const performData = ethers.utils.toUtf8Bytes("0x")
        const performUpkeep = await upkeep.connect(donTransmitter).performUpkeep(performData)
        await performUpkeep.wait()
        ranUpkeep = true
    }
    return ranUpkeep
}

export interface ReportValues {
    beaconBalance: number
    sweptBalance: number
    compoundablePoolIds: number[]
    withdrawnValidators: number
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
    const { beaconBalance, sweptBalance, compoundablePoolIds, withdrawnValidators } = values

    const reportRequests = (await upkeep.queryFilter(upkeep.filters.ReportRequestSent())).slice(-2)
    const requestIds = reportRequests.map((event) => event.args.requestId)
    
    const balancesRequestId = requestIds[0]
    const balancesResponse = ethers.utils.defaultAbiCoder.encode(
        [
            "uint128",
            "uint128"
        ],
        [
            ethers.utils.parseEther(beaconBalance.toString()),
            ethers.utils.parseEther(sweptBalance.toString())
        ]
    )
    
    await fulfillFunctionsRequest({
        donTransmitter,
        functionsBillingRegistry,
        requestId: balancesRequestId,
        response: balancesResponse
    })

    const detailsRequestId = requestIds[1]
    const detailsResponse = ethers.utils.defaultAbiCoder.encode(
        [
            "uint32[5]",
            "uint32"
        ],
        [
            compoundablePoolIds,
            withdrawnValidators
        ]
    )

    await fulfillFunctionsRequest({
        donTransmitter,
        functionsBillingRegistry,
        requestId: detailsRequestId,
        response: detailsResponse
    })
}

export async function fulfillFunctionsRequest({
    donTransmitter,
    functionsBillingRegistry,
    requestId,
    response
}: {
    donTransmitter: SignerWithAddress,
    functionsBillingRegistry: FunctionsBillingRegistry,
    requestId: string,
    response: string
}) {
    const dummyTransmitter = donTransmitter.address
    const dummySigners = Array(31).fill(dummyTransmitter)

    // const { success, result, resultLog } = await simulateRequest(requestConfig)
    
    const fulfillAndBill = await functionsBillingRegistry.connect(donTransmitter).fulfillAndBill(
        requestId,
        response,
        "0x",
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
