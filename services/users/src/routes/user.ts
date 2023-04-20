import express from 'express'
import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import { SessionRequest } from 'supertokens-node/framework/express'
import useDB from '../providers/db'

const router = express.Router()
const { addAccount, getUser, updateUserAddress, removeAccount } = useDB()

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

router.post('/add-sub-account', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        console.log('ADDING ACCOUNT!')
        const { account } = req.body
        const { ownerAddress } = account
        const userSessionsAddress = req.session?.getUserId()
        const validatedAddress = validateAddress(userSessionsAddress, ownerAddress)
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
        await addAccount(account)
        const user = await getUser(ownerAddress)
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: 'Account added',
            error: false,
            data: user
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

router.post('/remove-sub-account', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        console.log('REMOVING ACCOUNT!')
        const { address, currency, ownerAddress, walletProvider } = req.body
        const userSessionsAddress = req.session?.getUserId()
        const validatedAddress = validateAddress(userSessionsAddress, ownerAddress)
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
        const accountRemoved = await removeAccount({ address, currency, ownerAddress, walletProvider })
        const user = await getUser(ownerAddress)
        
        if (accountRemoved) {
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                message: 'Account removed',
                error: false,
                data: user
            })
        } else {
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                message: 'Account not found',
                error: true,
                data: user
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

// TODO: Think through handling changing primary address with SuperTokens Sessions.
router.put('/update-primary-account', verifySession(), async (req: SessionRequest, res: express.Response) => {
    const { userId } = req.body
    let { updatedAddress } = req.body
    updatedAddress = updatedAddress.toLowerCase()

    const user = await updateUserAddress(userId, updatedAddress)
    if (!user) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: 'User not found',
            error: true,
            data: null 
        })
    } else {
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: 'Primary account updated',
            error: false,
            data: user
        })
    }
})

function validateAddress(userSessionsAddress:string | undefined, address:string) {
    return userSessionsAddress === address
}

export default router