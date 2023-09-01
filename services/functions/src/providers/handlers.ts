import { decodeDietCBOR } from './format'
import { HandlerInput } from '../interfaces/HandlerInput'
import { simulateRequest, getDecodedResultLog, getRequestConfig } from '../../FunctionsSandboxLibrary'

export async function fulfillRequestHandler(input: HandlerInput): Promise<void> {
    const { requestId, data } = input.args
    if (!requestId) throw new Error('No request id provided')
    if (!data) throw new Error('No data provided')

    console.log(`ORACLE REQUEST ID ${requestId}`)
    console.log(`ORACLE REQUEST DATA ${data}`)
    console.log(`ORACLE REQUEST DECODED DATA ${JSON.stringify(decodeDietCBOR(data))}`)
}