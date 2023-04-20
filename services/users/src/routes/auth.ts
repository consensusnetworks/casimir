import express from 'express'
import useDB from '../providers/db'
import Session from 'supertokens-node/recipe/session'
import useEthers from '../providers/ethers'
import { Account, LoginCredentials, User } from '@casimir/types'

const { verifyMessage } = useEthers()
const { getUser, upsertNonce, addUser } = useDB()
const router = express.Router()

router.get('/message/:provider/:address', async (req: express.Request, res: express.Response) => {
    const { address } = req.params
    try {
        const nonce = await upsertNonce(address)
        if (nonce) {
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({ message: nonce })
        } else {
            res.status(404)
            res.send()
        }
    } catch (error) {
        console.log('error in /message/:provider/:address :>> ', error)
        res.status(500)
        res.send()
    }
})

router.post('/login', async (req: express.Request, res: express.Response) => {
    const { body } = req
    const { provider, address, currency, message, signedMessage } = body as LoginCredentials
    const user = await getUser(address)
    if (!user) {  // signup
        console.log('SIGNING UP!')
        const now = new Date().toISOString()
        const newUser = {
            address,
            createdAt: now,
            updatedAt: now,
        } as User
        const account = {
            address,
            currency,
            walletProvider: provider,
        } as Account

        const addUserResult = await addUser(newUser, account)

        if (addUserResult?.address !== address) {
            res.setHeader('Content-Type', 'application/json')
            res.status(500)
            res.json({
                error: true,
                message: 'Problem creating new user',
            })
        } else {
            await Session.createNewSession(req, res, address)
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                error: false,
                message: 'Sign Up Successful'
            })
        }
    } else { // login
        console.log('LOGGING IN!')
        const response = verifyMessage({ address, currency, message, signedMessage, provider })
        upsertNonce(address)
        response ? await Session.createNewSession(req, res, address) : null
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: response ? 'Login successful' : 'Login failed',
            error: false,
        })
    }
})

export default router