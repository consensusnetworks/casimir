import express from 'express'
import cors from 'cors'
import supertokens from 'supertokens-node'
import { middleware, errorHandler } from 'supertokens-node/framework/express'
import { SuperTokensBackendConfig } from './sessions.config'
import login from './routes/login'
import auth from './routes/auth'
import users from './routes/users'
import health from './routes/health'
import signupLogin from './routes/signupLogin'

supertokens.init(SuperTokensBackendConfig)

const port = process.env.PUBLIC_USERS_PORT || 4000

const app = express()
app.use(express.json())

/** CORS needs explicit origin (no *) with credentials:true */
app.use(
    cors({
        origin: 'http://localhost:3000',
        allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
        methods: ['GET', 'PUT', 'POST', 'DELETE'],
        credentials: true
    })
)

/** Expose all the APIs from SuperTokens to the client */
app.use(middleware())

app.use('/auth', auth)
app.use('/signupLogin', signupLogin)
app.use('/login', login)
app.use('/users', users)
app.use('/health', health)

/** Returns 401 to the client in the case of session related errors */
app.use(errorHandler())

app.listen(port)
console.log(`Users server listening on port ${port}`)