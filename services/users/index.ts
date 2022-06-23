import { APIGatewayEvent } from 'aws-lambda'
import signup from './api/signup'
import { APIGatewayResponse } from './env'

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
  'Content-Type': 'application/json'
}

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  if (event.path === '/users/signup') {
    console.log('SIGNUP')
    const response = await signup(event)
    return {
      headers: defaultHeaders,
      ...response
    }
  } else {
    console.log('NOT SIGNUP')
    return {
      headers: defaultHeaders,
      statusCode: 404,
      body: {
        message: 'Requested route does not exist'
      }
    }
  }
}