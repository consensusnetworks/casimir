import express from 'express'
import useUsers from '../providers/users'
import { userCollection } from '../collections/users'
import Session from 'supertokens-node/recipe/session'
import useEthers from '../providers/ethers'
import { Account } from '@casimir/types'
import { SignupLoginCredentials } from '@casimir/types/src/interfaces/SignupLoginCredentials'

const { verifyMessage } = useEthers()
const { getMessage, updateMessage } = useUsers()
const router = express.Router()


router.get('/:provider/:address', async (req: express.Request, res: express.Response) => {
    const { provider, address } = req.params
    updateMessage(provider, address)
    const message = getMessage(address)
    if (message) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({ message })
    } else {
        res.status(404)
        res.send()
    }
})

router.use('/signupLogin', async (req: express.Request, res: express.Response) => {
    const { body } = req
    const { provider, address, currency, message, signedMessage } = body as SignupLoginCredentials
    const user = userCollection.find(user => user.address === address.toLowerCase())
    if (user && !user?.accounts) {  // signup
        const accounts: Array<Account> = [
            {
                address: address,
                currency: currency,
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0,
                walletProvider: provider
            },
        ]
        user.accounts = accounts
        user.accounts.length ? await Session.createNewSession(req, res, address) : null
        
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: user.accounts.length ? 'Sign Up Successful' : 'Problem creating new user',
            error: false,
        })
    } else { // login
        const response = verifyMessage({ address, message, signedMessage, provider })
        updateMessage(provider, address) // send back token if successful
        
        response ? await Session.createNewSession(req, res, address) : null
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: response ? 'Login successful' : 'Login failed',
            error: false,
        })
    }
})

// TODO: Is this being used at all?
router.post('/:address', async (req: express.Request, res: express.Response) => {
    const { address } = req.params
    const { message } = req.body
    const user = userCollection.find(user => user.address === address)
    if (user) {
        user.nonce = message
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: `Message updated to: ${message}`,
            error: false
        })
    } else {
        res.status(404)
        res.json({
            message: 'User not found',
            error: true
        })
    }
})

export default router