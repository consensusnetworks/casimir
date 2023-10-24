import { ethers } from 'ethers'
import { decodeDietCBOR } from './format'
import requestConfig from '@casimir/functions/Functions-request-config'
import { simulateRequest } from '../../FunctionsSandboxLibrary'
import { getConfig } from './config'
import { FunctionsBillingRegistry } from '@casimir/ethereum/build/@types'
import { updateExecutionLog } from '@casimir/logs'
import { HandlerInput } from '../interfaces/HandlerInput'

const config = getConfig()

export async function fulfillRequestHandler(input: HandlerInput): Promise<void> {
    const { requestId, data } = input.args as ethers.utils.Result
    if (!requestId) throw new Error('No request id provided')
    if (!data) throw new Error('No data provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const functionsBillingRegistry = new ethers.Contract(config.functionsBillingRegistryAddress, config.functionsBillingRegistryAbi, signer) as ethers.Contract & FunctionsBillingRegistry
    const { args } = decodeDietCBOR(data)
    const currentRequestConfig = {
        ...requestConfig,
        args
    }
    const { result, resultLog, success } = await simulateRequest(currentRequestConfig)
    if (success) {        
        const dummySigners = Array(31).fill(signer.address)    
        const fulfillAndBill = await functionsBillingRegistry.fulfillAndBill(
            requestId,
            result,
            '0x',
            signer.address,
            dummySigners,
            4,
            100_000,
            500_000,
            {
                gasLimit: 500_000,
            }
        )
        await fulfillAndBill.wait()
        if (process.env.USE_LOGS === 'true') {
            updateExecutionLog('execution.log', resultLog)
        }
    } else {
        throw new Error(resultLog)
    }
}