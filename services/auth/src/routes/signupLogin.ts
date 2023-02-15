import express from 'express'
import useEthers from '../providers/ethers'
import { Account, LoginCredentials } from '@casimir/types'
import { SignupLoginCredentials } from '@casimir/types/src/interfaces/SignupLoginCredentials'
import useUsers from '../providers/users'
import { userCollection } from '../collections/users'

const { verifyMessage } = useEthers()
const { updateMessage } = useUsers()
const router = express.Router()

// Signup or Login
router.use('/', async (req: express.Request, res: express.Response) => {
    const { body } = req
    const { provider, address, currency, message, signedMessage } = body as SignupLoginCredentials
    const user = userCollection.find(user => user.address === address.toLowerCase())
    if (user && !user?.accounts) {  // signup
        console.log('got into this block in signupLogin.ts')
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
        console.log('user :>> ', user)
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: user.accounts.length ? 'Sign Up Successful' : 'Problem creating new user',
            error: false,
            data: user ? user : null
        })
    } else { // login
        const response = verifyMessage({ address, message, signedMessage, provider })
        updateMessage(provider, address) // send back token if successful}
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: response ? 'Login successful' : 'Login failed',
            error: false,
            data: user,
        })
    }
})

// Login (old)
router.use('/login', async (req: express.Request, res: express.Response) => {
    const { body } = req
    const { address, message, signedMessage, provider } = body as LoginCredentials
    const response = verifyMessage({ address, message, signedMessage, provider })
    if (response) updateMessage(provider, address) // send back currency if successful
    const user = userCollection.find(user => user.address === address.toLowerCase())
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({
        message: response ? 'Login successful' : 'Login failed',
        error: false,
        data: user,
    })
})

// Signup (old)
router.use('/signUp', async (req: express.Request, res: express.Response) => {
    try {
        const { body } = req
        const { address, provider, currency } = body as SignupLoginCredentials
        const user = userCollection.find(user => user.address === address.toLowerCase())
        console.log('user :>> ', user)
        const newUser = {
            address: address.toLowerCase(),
            accounts: [
                {
                    address: address,
                    currency: currency,
                    balance: '1000000000000000000',
                    balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                    roi: 0,
                    walletProvider: provider
                },
            ],
            nonce: generateNonce()
        }
        if (!user) {
            console.log('pushing in user')
            userCollection.push(newUser)
        }
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: user ? 'Account already exists at that address' : 'Sign Up Successful',
            error: false,
            data: user ? user : newUser
        })
    } catch (err) {
        console.log('err :>> ', err)
        res.status(500)
        res.json({
            message: 'Error signing up',
            error: true
        })
    }
})

function generateNonce() {
    return (Math.floor(Math.random()
        * (Number.MAX_SAFE_INTEGER - 1)) + 1).toString()
}

export default router