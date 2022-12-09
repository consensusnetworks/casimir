import express from 'express'
import useKeys from '../providers/keys'

const { getDepositData } = useKeys()
const router = express.Router()

router.use('/', async (req: express.Request, res: express.Response) => {
    const { withdrawalAddress, operators } = req.body
    const { shares } = await getDepositData(withdrawalAddress, operators)

    // Todo get remainder of beacon deposit and SSV registration data

    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({ operators, shares })
})

export default router