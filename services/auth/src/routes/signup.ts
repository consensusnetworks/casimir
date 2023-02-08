import express from 'express'
import { SignupCredentials } from '../interfaces/SignupCredentials'
import { userCollection } from '../collections/users'

const router = express.Router()

router.use('/', async (req: express.Request, res: express.Response) => {
    console.log('got to signup route')
    try {
        const { body } = req
        const { address, provider, token } = body as SignupCredentials
        const user = userCollection.find(user => user.address === address.toLowerCase())
        const newUser = {
            address: address.toLowerCase(),
            accounts: [
                {
                    address: address,
                    currency: token,
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
            data: newUser, // TODO: This is only for testing purposes. Replace with user.
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