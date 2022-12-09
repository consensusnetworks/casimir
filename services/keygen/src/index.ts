import express from 'express'
import cors from 'cors'
import create from './routes/create'

const port = process.env.PUBLIC_KEYGEN_PORT || 8500

const app = express()
app.use(express.json())
app.use(cors())

app.use('/create', create)

app.listen(port, () => console.log(`Keygen listening on port ${port}`))