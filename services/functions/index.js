import { ethers } from 'ethers'
import { CasimirUpkeep, FunctionsBillingRegistry } from '@casimir/ethereum/build/@types'
import FunctionsBillingRegistryInterfaceAbi from '@casimir/ethereum/build/abi/FunctionsBillingRegistryInterface.json'
import ICasimirUpkeepAbi from '@casimir/ethereum/build/abi/ICasimirUpkeep.json'
import requestConfig from './Functions-request-config'
import { simulateRequest, getDecodedResultLog, getRequestConfig } from './FunctionsSandboxLibrary'

if (process.env.SIMULATE_FUNCTIONS) {
    void async function () {
        if (!process.env.ETHEREUM_RPC_URL) throw new Error('No ethereum RPC URL provided')
        if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error('No functions billing registry address provided')
        if (!process.env.UPKEEP_ADDRESS) throw new Error('No upkeep address provided')

        const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL)

        /** @type {ethers.Contract & FunctionsBillingRegistry} */
        const functionsBillingRegistry = new ethers.Contract(process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS, FunctionsBillingRegistryInterfaceAbi, provider)

        /** @type {ethers.Contract & CasimirUpkeep} */
        const upkeep = new ethers.Contract(process.env.UPKEEP_ADDRESS, ICasimirUpkeepAbi, provider)
        
        upkeep.on('RequestSent', async (event) => {
            console.log("Request SENT EVENT", event)
            // const details = event?.[event.length - 1]
            // const { args } = details
            // const { requestId } = args
            // console.log(`Request ${requestId} sent`)
        })
        // for await (const event of eventsIterable) {
        //     const details = event?.[event.length - 1]
        //     const { args } = details
        //     const handler = handlers[details.event]
        //     if (!handler) throw new Error(`No handler found for event ${details.event}`)
        //     await handler({ args })
        // }
    }()
}

export { requestConfig }