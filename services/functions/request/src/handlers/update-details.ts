import { Config } from "../providers/config.ts"
import { Execution } from "../providers/execution.ts"
import { Beacon } from "../providers/beacon.ts"
import { concatUint8Arrays, encodeUint32, encodeUint32Array } from "../providers/codec.ts"

export async function updateDetailsHandler() {
    const config = new Config()
    const exeuction = new Execution({
        ethereumUrl: config.ethereumUrl,
        viewsAddress: config.viewsAddress
    })
    const beacon = new Beacon(config.ethereumBeaconUrl)

    const stakedPoolCount = await exeuction.getStakedPoolCount()
    const startIndex = BigInt(0).toString(16).padStart(64, "0")
    const endIndex = BigInt(stakedPoolCount).toString(16).padStart(64, "0")

    const compoundablePoolIds = await exeuction.getCompoundablePoolIds(startIndex, endIndex)

    const stakedPoolPublicKeys = await exeuction.getStakedPoolPublicKeys(startIndex, endIndex)
    const stakedPoolStatuses = await exeuction.getStakedPoolStatuses(startIndex, endIndex) // Not used yet
    const validators = await beacon.getValidators(stakedPoolPublicKeys)

    const withdrawnValidators = validators.reduce((accumulator, validator, i) => {
        const { status } = validator
        const withdrawalDone = status === "withdrawal_done"
        const poolStatus = stakedPoolStatuses[i]
        const poolWithdrawn = poolStatus === 5
        if (withdrawalDone && !poolWithdrawn) {
            accumulator += 1
        }
        return accumulator
    }, 0)

    console.log("Results", {
        compoundablePoolIds,
        withdrawnValidators
    })

    return concatUint8Arrays([
        encodeUint32Array(compoundablePoolIds),
        encodeUint32(withdrawnValidators)
    ])
}