import express from 'express'
import useOperators from '../providers/operators'
import useValidator from '../providers/validator'

const { getOperators } = useOperators()
const { getValidator } = useValidator()
const router = express.Router()

router.post('/create', async (req: express.Request, res: express.Response) => {
    const { poolId } = req.body
    const operators = await getOperators()
    const validator = await getValidator(operators)

    // Todo return beacon deposit and SSV registration data

    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({ poolId, operators, validator })
})

export default router