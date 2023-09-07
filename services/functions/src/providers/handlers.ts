import { ethers } from 'ethers'
import { decodeDietCBOR } from './format'
import { HandlerInput } from '../interfaces/HandlerInput'
import requestConfig from '@casimir/functions/Functions-request-config'
import { simulateRequest } from '../../FunctionsSandboxLibrary'
import { getConfig } from './config'

const config = getConfig()

export async function fulfillRequestHandler(input: HandlerInput): Promise<void> {
    const { requestId, data } = input.args
    if (!requestId) throw new Error('No request id provided')
    if (!data) throw new Error('No data provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const functionsBillingRegistry = new ethers.Contract(config.functionsBillingRegistryAddress, config.functionsBillingRegistryAbi, signer) as ethers.Contract
    const { args } = decodeDietCBOR(data)
    const currentRequestConfig = {
        ...requestConfig,
        args
    }
    const { result, success } = await simulateRequest(currentRequestConfig)
    const response = success ? result : '0x'
    const executionError = success ? '0x' : result
    const dummySigners = Array(31).fill(signer.address)    
    // const fulfillAndBill = await functionsBillingRegistry.fulfillAndBill(
    //     requestId,
    //     response,
    //     executionError,
    //     signer.address,
    //     dummySigners,
    //     4,
    //     100_000,
    //     500_000,
    //     {
    //         gasLimit: 500_000,
    //     }
    // )
    // await fulfillAndBill.wait()
}