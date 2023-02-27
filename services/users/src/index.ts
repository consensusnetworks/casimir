import express from 'express'
import cors from 'cors'
import login from './routes/login'
import auth from './routes/auth'
import users from './routes/users'
import health from './routes/health'

const port = process.env.PUBLIC_AUTH_PORT || 4000

const app = express()
app.use(express.json())
app.use(cors())

app.use('/login', login)
app.use('/auth', auth)
app.use('/users', users)
app.use('/health', health)

app.listen(port)
console.log(`Auth server listening on port ${port}`)