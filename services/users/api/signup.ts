import pinpointClient from '../lib/pinpoint'
import {
    SendMessagesCommand,
    UpdateEndpointCommand
} from '@aws-sdk/client-pinpoint'
import { APIGatewayEvent } from 'aws-lambda'
import { pascalCase } from '@casimir/lib'
import { SignupResponse } from '../env'

const appId = 'e80548536df34c7fb4a58bf64933190e'
const sourceEmail = 'team@casimir.co'
const project = process.env.PROJECT || 'casimir'
const stage = process.env.STAGE || 'dev'

/**
 * Sends a "Welcome" message to a newly signed up user via Pinpoint.
 *
 * @param event - The client request object
 * @returns A promise of SignupResponse with statusCode and body
 *
 */
export default async function signup(event: APIGatewayEvent): Promise<SignupResponse> {
    console.log('EVENT: ', event)

    const { body } = event
    const { email: destEmail } = JSON.parse(body as string)

    console.log('Sending welcome message to:', destEmail)

    const updateEndpointParams = {
        ApplicationId: appId,
        EndpointId: destEmail,
        EndpointRequest: {
            Address: destEmail,
            EndpointStatus: 'ACTIVE',
            ChannelType: 'EMAIL',
            OptOut: 'NONE',
            User: {
                UserId: destEmail
            }
        }
    }

    const sendMessageParams = {
        ApplicationId: appId,
        MessageRequest: {
            Addresses: {
                [destEmail]: {
                    ChannelType: 'EMAIL'
                }
            },
            MessageConfiguration: {
                EmailMessage: {
                    FromAddress: sourceEmail
                }
            },
            TemplateConfiguration: {
                EmailTemplate: {
                    // CasimirWelcomeDev by default, CasimirWelcomeProd in production
                    Name: `${pascalCase(project)}Welcome${pascalCase(stage)}`
                }
            }
        }
    }

    const updateEndpoint = new UpdateEndpointCommand(updateEndpointParams)
    const sendMessage = new SendMessagesCommand(sendMessageParams)

    try {
        const data = await Promise.all([
            pinpointClient.send(updateEndpoint),
            pinpointClient.send(sendMessage)
        ])
        console.log(data)
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            statusCode: 200,
            body: data
        }
    } catch (error) {
        console.log(error)
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            statusCode: 500,
            body: error as Error
        }
    }
}