import express from 'express'
import useEthers from '../providers/ethers'
import { LoginCredentials } from '@casimir/types'

const { verifyMessage } = useEthers()
const router = express.Router()

router.use('/', async (req: express.Request, res: express.Response) => {
    const { body } = req
    const { address, message, signedMessage } = body as LoginCredentials
    const response = verifyMessage({ address, message, signedMessage })
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json(response)
})

export default router