import { Config } from "../providers/config.ts"
import { Execution } from "../providers/execution.ts"
import { Beacon } from "../providers/beacon.ts"
import { concatUint8Arrays } from "../providers/codec.ts"
import { gweiToWei } from "../providers/units.ts"

export async function updateBalancesHandler() {
    const config = new Config()
    const execution = new Execution({
        ethereumUrl: config.ethereumUrl,
        viewsAddress: config.viewsAddress
    })
    const beacon = new Beacon(config.ethereumBeaconUrl)

    const stakedPoolCount = await execution.getStakedPoolCount()
    const startIndex = BigInt(0).toString(16).padStart(64, "0")
    const endIndex = BigInt(stakedPoolCount).toString(16).padStart(64, "0")

    const stakedPoolPublicKeys = await execution.getStakedPoolPublicKeys(startIndex, endIndex)
    const validators = await beacon.getValidators(stakedPoolPublicKeys)

    const beaconBalance = gweiToWei(validators.reduce((accumulator, { balance }) => {
        accumulator += parseFloat(balance)
        return accumulator
    }, 0))

    const sweptBalance = gweiToWei(await execution.getSweptBalance(startIndex, endIndex))

    console.log("Results", {
        beaconBalance,
        sweptBalance
    })

    return concatUint8Arrays([
        Functions.encodeUint256(beaconBalance),
        Functions.encodeUint256(sweptBalance)
    ])
}