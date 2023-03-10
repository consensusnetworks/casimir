import express from 'express'
import { userCollection } from '../collections/users'
import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import { SessionRequest } from 'supertokens-node/framework/express'
import useDB from '../providers/db'

const router = express.Router()
const { getUser } = useDB()

router.get('/', verifySession(), async (req: SessionRequest, res: express.Response) => {
    const address = req.session?.getUserId() as string
    const user = await getUser(address)
    const message = user ? 'User found' : 'User not found'
    const error = user ? false : true
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({
        message,
        error,
        user
    })
})

// TODO: Think through handling changing primary address with SuperTokens Sessions.
router.put('/update-primary-account', async (req: express.Request, res: express.Response) => {
    let { primaryAddress, updatedProvider, updatedAddress } = req.body
    primaryAddress = primaryAddress.toLowerCase()
    updatedProvider = updatedProvider.toLowerCase()
    updatedAddress = updatedAddress.toLowerCase()
    const user = userCollection.find(user => user.address === primaryAddress)
    if (user) {
        user.address = updatedAddress
    }
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({
        message: 'Primary account updated',
        error: false,
        data: user
    })
})

router.post('/add-sub-account', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        const { account } = req.body
        const { address } = req.body
        const userSessionsAddress = req.session?.getUserId()
        const validatedAddress = validateAddress(userSessionsAddress, address)
        if (!validatedAddress) {    
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                message: 'Address does not match session',
                error: true,
                data: null
            })
            return
        }
        const existingUser = userCollection.find(user => user.address === address)
        if (existingUser) existingUser.accounts?.push(account)
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: 'Account added',
            error: false,
            data: existingUser
        })
    } catch (err) {
        console.log('err :>> ', err)
        res.status(500)
        res.json({
            message: 'Error adding account',
            error: true
        })
    }
})

router.post('/remove-sub-account', verifySession(), async (req: express.Request, res: express.Response) => {
    try {
        const { provider, address, currency } = req.body
        let { primaryAddress } = req.body
        primaryAddress = primaryAddress.toLowerCase()
        const existingUser = userCollection.find(user => user.address === primaryAddress)
        let accountedRemoved = false
        if (existingUser) {
            existingUser.accounts = existingUser.accounts?.filter(account => {
                const notAddress = account.walletProvider !== provider || account.address !== address || account.currency !== currency
                if (!notAddress) {
                    accountedRemoved = true
                } else {
                    return account
                }
            })
        }
        if (accountedRemoved) {
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                message: 'Account removed',
                error: false,
                data: existingUser
            })
        } else {
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                message: 'Account not found',
                error: true,
                data: existingUser
            })
        }
    } catch (err) {
        console.log('err :>> ', err)
        res.status(500)
        res.json({
            message: 'Error adding account',
            error: true
        })
    }
})

function validateAddress(userSessionsAddress:string | undefined, address:string) {
    return userSessionsAddress === address
}

export default router