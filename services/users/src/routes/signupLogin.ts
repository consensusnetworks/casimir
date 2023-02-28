import express from 'express'
import useEthers from '../providers/ethers'
import { Account } from '@casimir/types'
import { SignupLoginCredentials } from '@casimir/types/src/interfaces/SignupLoginCredentials'
import useUsers from '../providers/users'
import { userCollection } from '../collections/users'
import Session from 'supertokens-node/recipe/session'

const { verifyMessage } = useEthers()
const { updateMessage } = useUsers()
const router = express.Router()

// Signup or Login
router.use('/', async (req: express.Request, res: express.Response) => {
    const { body } = req
    const { provider, address, currency, message, signedMessage } = body as SignupLoginCredentials
    const user = userCollection.find(user => user.address === address.toLowerCase())
    if (user && !user?.accounts) {  // signup
        console.log('-----------------got into this block in signupLogin.ts-----------------')
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
        // user.accounts.length ? await Session.createNewSession(req, res, address) : null
        /* a new session has been created.
        * - an access & refresh token has been attached to the response's cookie
        * - a new row has been inserted into the database for this new session
        */

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
        /* a new session has been created.
        * - an access & refresh token has been attached to the response's cookie
        * - a new row has been inserted into the database for this new session
        */
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: response ? 'Login successful' : 'Login failed',
            error: false,
        })
    }
})

export default router