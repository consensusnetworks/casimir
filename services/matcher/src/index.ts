import express from 'express'
import cors from 'cors'
import create from './routes/create'

const port = process.env.PUBLIC_MATCHER_PORT || 8000

const app = express()
app.use(express.json())
app.use(cors())

app.post('/create', create)

app.listen(port, () => console.log(`Matcher listening on port ${port}`))