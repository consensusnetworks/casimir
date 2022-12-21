import serverless from 'serverless-http'
import express from 'express'
import cors from 'cors'
import { APIGatewayEventRequestContext, APIGatewayProxyEvent } from 'aws-lambda'
import login from './routes/login'
import auth from './routes/auth'
import users from './routes/users'

const app = express()
app.use(express.json())
app.use(cors())

app.use('/login', login)
app.use('/auth', auth)
app.use('/users', users)

export const handler = async function (event: APIGatewayProxyEvent, context: APIGatewayEventRequestContext) {
  const serverlessApp = serverless(app)
  return await serverlessApp(event, context)
}