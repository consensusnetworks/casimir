import express from 'express'
import cors from 'cors'
import supertokens from 'supertokens-node'
import { middleware, errorHandler } from 'supertokens-node/framework/express'
import { SuperTokensBackendConfig } from './sessions.config'
import auth from './routes/auth'
import user from './routes/user'
import health from './routes/health'
import seed from './routes/seed'

supertokens.init(SuperTokensBackendConfig)

const port = process.env.PUBLIC_USERS_PORT || 4000

const app = express()
app.use(express.json())

/** CORS needs explicit origin (no *) with credentials:true */
app.use(
    cors({
        origin: 'http://localhost:3001',
        allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
        methods: ['GET', 'PUT', 'POST', 'DELETE'],
        credentials: true
    })
)

/** Expose all the APIs from SuperTokens to the client */
app.use(middleware())

app.use('/auth', auth)
app.use('/user', user)
app.use('/health', health)
app.use('/seed', seed)

/** Returns 401 to the client in the case of session related errors */
app.use(errorHandler())

app.listen(port)
console.log(`Users server listening on port ${port}`)