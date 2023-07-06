import express from 'express'
import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import { SessionRequest } from 'supertokens-node/framework/express'
import useDB from '../providers/db'

const router = express.Router()
const { addAccount, getAccounts, getUser, getUserById, updateUserAddress, updateUserAgreedToTermsOfService, removeAccount } = useDB()

router.get('/', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        const address = req.session?.getUserId().toLowerCase() as string
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
    } catch (err) {
        res.status(500)
        res.json({
            message: 'Error getting user',
            error: true,
            user: null
        })
    }
})

router.post('/add-sub-account', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        console.log('ADDING ACCOUNT!')
        const { account } = req.body
        const { ownerAddress } = account
        const userSessionsAddress = req.session?.getUserId().toLowerCase()
        const validatedAddress = validateAddress(userSessionsAddress, ownerAddress)
        if (!validatedAddress) {
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                message: 'Address does not match session',
                error: true,
                data: null
            })
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
        res.status(500)
        res.json({
            message: 'Error adding account',
            error: true,
            data: null
        })
    }
})

router.get('/check-if-primary-address-exists/:provider/:address', async (req: express.Request, res: express.Response) => {
    try {
        const { params } = req
        const { address, provider } = params
        const user = await getUser(address)
        const userAddress = user?.address
        const userProvider = user?.walletProvider
        const sameAddress = userAddress === address
        const sameProvider = userProvider === provider
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            error: false,
            message: 'Successfully checked if primary address exists',
            data: {
                sameAddress,
                sameProvider
            }
        })
    } catch (error: any) {
        const { message } = error
        res.setHeader('Content-Type', 'application/json')
        res.status(500)
        res.json({
            error: true,
            message: message || 'Problem checking if primary address exists'
        })
    }
})

router.get('/check-secondary-address/:address', async (req: express.Request, res: express.Response) => {
    try {
        const { params } = req
        const { address } = params
        const accounts = await getAccounts(address)
        const users = await Promise.all(accounts.map(async account => {
            const { userId } = account
            const user = await getUserById(userId)
            const { address, walletProvider } = user
            return { 
                address: maskAddress(address),
                walletProvider,
            }
        }))
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            error: false,
            message: 'Successfully checked secondary address',
            data: users
        })
    } catch (error: any) {
        res.setHeader('Content-Type', 'application/json')
        res.status(500)
        res.json({
            error: true,
            message: error.message || 'Problem checking secondary address'
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

router.put('/update-user-agreement/:userId', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        const { agreed } = req.body
        const { userId } = req.params
        const userID = parseInt(userId)
        const user = await updateUserAgreedToTermsOfService(userID, agreed)
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: 'User agreement updated',
            error: false,
            data: user
        })
    } catch (err) {
        res.status(500)
        res.json({
            message: 'Error updating user agreement',
            error: true,
            data: null
        })
    }
})

function maskAddress(address: string) {
    return address.slice(0, 6) + '...' + address.slice(-4)
}

function validateAddress(userSessionsAddress:string | undefined, address:string) {
    return userSessionsAddress === address
}

export default router