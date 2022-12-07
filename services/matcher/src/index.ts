import express from 'express'
import cors from 'cors'

const port = process.env.PUBLIC_MATCHER_PORT || 8000

const app = express()
app.use(express.json())
app.use(cors())

app.use('/', (req: express.Request, res: express.Response) => {
    const { poolId } = req.query
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({ poolId })
})

app.listen(port, () => console.log(`Matcher listening on port ${port}`))