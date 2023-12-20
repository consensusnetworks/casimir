import { Config, REQUEST_TYPE } from "./providers/config.ts"
import { updateBalancesHandler } from "./handlers/update-balances.ts"
import { updateDetailsHandler } from "./handlers/update-details.ts"

(async function main() {
    const config = new Config()
    switch (config.requestType) {
    case REQUEST_TYPE.BALANCES:
        return await updateBalancesHandler()
    case REQUEST_TYPE.DETAILS:
        return await updateDetailsHandler()
    default:
        throw new Error("Invalid request type")
    }
})()