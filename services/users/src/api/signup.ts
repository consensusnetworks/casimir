import pinpointClient from '../lib/pinpoint'
import {
    SendMessagesCommand,
    SendMessagesCommandOutput,
    UpdateEndpointCommand,
    UpdateEndpointCommandOutput
} from '@aws-sdk/client-pinpoint'
import express from 'express'
import { pascalCase } from '@casimir/helpers'

const appId = 'e80548536df34c7fb4a58bf64933190e'
const sourceEmail = 'team@casimir.co'
const project = process.env.PROJECT || 'casimir'
const stage = process.env.STAGE || 'dev'

/**
 * Sends a "Welcome" message to a newly signed up user via Pinpoint.
 *
 * @param res - The client request object
 * @returns A promise of data object with list of Pinpoint responses [UpdateEndpointCommandOutput, SendMessagesCommandOutput]
 *
 */
export default async function signup(res: express.Request): Promise<{ data: { signup: [UpdateEndpointCommandOutput, SendMessagesCommandOutput] }}> {
    const { body } = res
    const { email: destEmail } = body

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

    const signup = await Promise.all([
        pinpointClient.send(updateEndpoint),
        pinpointClient.send(sendMessage)
    ])

    return { data: { signup } }
}