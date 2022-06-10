import { SignupResponse } from '@casimir/website/src/env'
import { APIGatewayEvent } from 'aws-lambda'
import signup from './api/signup'

export const handler = async (event: APIGatewayEvent): Promise<SignupResponse | void> => {
  if (event.path === '/api/users/signup') {
    return await signup(event)
  }
}