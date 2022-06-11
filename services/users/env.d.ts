import {
    SendMessagesCommandOutput,
    UpdateEndpointCommandOutput
} from '@aws-sdk/client-pinpoint'

declare type SignupResponse = {
    headers?: any
    statusCode: number
    body: [UpdateEndpointCommandOutput, SendMessagesCommandOutput] | Error
}