import {
    SendMessagesCommandOutput,
    UpdateEndpointCommandOutput
} from '@aws-sdk/client-pinpoint'

declare type APIGatewayResponse = {
    headers?: any
    statusCode: number
    body: [UpdateEndpointCommandOutput, SendMessagesCommandOutput] | any | Error
}