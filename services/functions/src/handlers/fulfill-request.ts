import { ethers } from "ethers"
import { decodeDietCBOR } from "../providers/format"
import requestConfig from "../../request/config"
import { simulateScript } from "@chainlink/functions-toolkit"
import { Config } from "../providers/config"
import { FunctionsBillingRegistry } from "@casimir/ethereum/build/@types"
import { updateExecutionLog } from "@casimir/logs"
import { HandlerInput } from "../interfaces/HandlerInput"
import FunctionsBillingRegistryAbi from "@casimir/ethereum/build/abi/FunctionsBillingRegistry.json"

export async function fulfillRequestHandler(input: HandlerInput): Promise<void> {
    const config = new Config()
    const { requestId, data } = input.args as ethers.utils.Result
    if (!requestId) throw new Error("No request id provided")
    if (!data) throw new Error("No data provided")

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const functionsBillingRegistry = new ethers.Contract(
        config.functionsBillingRegistryAddress, FunctionsBillingRegistryAbi, provider
    ) as FunctionsBillingRegistry

    const { args } = decodeDietCBOR(data)
    const currentRequestConfig = {
        ...requestConfig,
        args
    }

    const { capturedTerminalOutput, errorString, responseBytesHexstring } = await simulateScript(currentRequestConfig)
    if (!errorString) {
        if (!config.dryRun) {
            const signer = config.wallet.connect(provider)        
            const dummySigners = Array(31).fill(signer.address)  
            const reportValidationGas = 100000
            const initialGas = 500000
            const fulfillAndBill = await functionsBillingRegistry.connect(signer).fulfillAndBill(
                requestId,
                responseBytesHexstring as string,
                "0x",
                signer.address,
                dummySigners,
                4,
                reportValidationGas,
                initialGas,
                {
                    gasLimit: initialGas
                }
            )
            await fulfillAndBill.wait()
            if (process.env.USE_LOGS === "true") {
                updateExecutionLog("execution.log", capturedTerminalOutput)
            }
        }
    } else {
        throw new Error(errorString)
    }
}