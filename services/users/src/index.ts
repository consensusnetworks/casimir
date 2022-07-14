import serverless from 'serverless-http'
import express from 'express'
import cors from 'cors'
import { APIGatewayEventRequestContext, APIGatewayProxyEvent } from 'aws-lambda'
import signup from './api/signup'

const app = express()
app.use(express.json())
app.use(cors())

app.use('/users/signup', async (req: express.Request, res: express.Response) => {
  const response = await signup(req)
  res.setHeader('Content-Type', 'application/json')
  res.status(200)
  res.json(response)
})

export const handler = async function (event: APIGatewayProxyEvent, context: APIGatewayEventRequestContext) {
  const serverlessApp = serverless(app)
  return await serverlessApp(event, context)
}