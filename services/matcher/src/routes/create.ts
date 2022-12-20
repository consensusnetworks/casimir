import express from 'express'
import useValidator from '../providers/validator'

const { getValidatorInit } = useValidator()
const router = express.Router()

router.use('/', async (req: express.Request, res: express.Response) => {
    const { poolId, withdrawalAddress } = req.body
    const { operators, shares } = await getValidatorInit(withdrawalAddress)

    // Todo return beacon deposit and SSV registration data

    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({ poolId, operators, shares })
})

export default router