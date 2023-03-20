import express from 'express'
import useUsers from '../providers/users'
import useDB from '../providers/db'
import Session from 'supertokens-node/recipe/session'
import useEthers from '../providers/ethers'
import { Account } from '@casimir/types'
import { LoginCredentials } from '@casimir/types'

const { verifyMessage } = useEthers()
const { getMessage, updateMessage } = useUsers()
const { getUser } = useDB()
const router = express.Router()


router.get('/message/:provider/:address', (req: express.Request, res: express.Response) => {
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

router.use('/login', async (req: express.Request, res: express.Response) => {
    const { body } = req
    const { provider, address, currency, message, signedMessage } = body as LoginCredentials
    // TODO: 3/20 Replace with checking if user exists in DB
    const user = await getUser(address)
    console.log('user :>> ', user)
    if (user && !user?.accounts) {  // signup
        console.log('SIGNING UP!')
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
        console.log('LOGGING IN!')
        const response = verifyMessage({ address, currency, message, signedMessage, provider })
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

export default router