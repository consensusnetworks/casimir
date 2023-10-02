import express from 'express'
import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import { SessionRequest } from 'supertokens-node/framework/express'
import useDB from '../providers/db'

const router = express.Router()
const { addAccount, addOperator, getAccounts, getUserByAddress, getUserById, updateUserAddress, updateUserAgreedToTermsOfService, removeAccount } = useDB()

router.get('/', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        const id = req.session?.getUserId() as string
        console.log('getting user by id :>> ', id)
        const user = await getUserById(id)
        console.log('user in user home route :>> ', user)
        const message = user ? 'User found' : 'User not found'
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message,
            error: false,
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
        const { account, id } = req.body
        const { ownerAddress } = account
        const userId = id.toString()
        const userSessionId = req.session?.getUserId()
        const validatedUserId = validateUserId(userSessionId, userId)
        console.log('validatedUserId :>> ', validatedUserId)
        if (!validatedUserId) {
            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.json({
                message: 'Address does not match session',
                error: true,
                data: null
            })
        }
        await addAccount(account)
        const user = await getUserByAddress(ownerAddress)
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

router.post('/add-operator', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        console.log('ADDING OPERATOR!')
        const { address, nodeUrl } = req.body
        const userId = parseInt(req.session?.getUserId() as string)
        const accounts = await getAccounts(address)
        const userAccount = accounts.find(account => parseInt(account.userId) === userId)
        const accountId = userAccount?.id as number
        await addOperator({ accountId, nodeUrl, userId })
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: 'Operator added',
            error: false
        })
    } catch (err) {
        res.status(500)
        res.json({
            message: 'Error adding operator',
            error: true
        })
    }
})

router.get('/check-if-primary-address-exists/:address', async (req: express.Request, res: express.Response) => {
    try {
        const { params } = req
        const { address } = params
        const user = await getUserByAddress(address)
        console.log('user in check-if-primary-.....:>> ', user)
        const userAddress = user?.address
        const userProvider = user?.walletProvider
        const sameAddress = userAddress === address
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            error: false,
            message: 'Successfully checked if primary address exists',
            data: {
                sameAddress,
                walletProvider: userProvider
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
        console.log('error in /check-secondary-address :>> ', error)
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
        const { address, currency, id, ownerAddress, walletProvider } = req.body
        const userId = id.toString()
        const userSessionId = req.session?.getUserId()
        const validatedAddress = validateUserId(userSessionId, userId)
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
        const user = await getUserByAddress(ownerAddress)
        
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

function validateUserId(userSessionId:string | undefined, userId:string) {
    return userSessionId === userId
}

export default router