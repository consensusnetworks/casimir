import { APIGatewayEvent } from 'aws-lambda'
import signup from './api/signup'

export const handler = async (event: APIGatewayEvent): Promise<any | void> => {
  if (event.path === '/api/users/signup') {
    return await signup(event)
  } else if (event.path === '/api/ping') {
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      statusCode: 200,
      body: {
        message: 'pong'
      }
    }
  }
}