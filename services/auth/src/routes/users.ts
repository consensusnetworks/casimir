import express from 'express'
import { userCollection } from '../collections/users'
const router = express.Router()

router.put('/', async (req: express.Request, res: express.Response) => {
    let { primaryAccount, updatedProvider, updatedAccount } = req.body
    primaryAccount = primaryAccount.toLowerCase()
    updatedProvider = updatedProvider.toLowerCase()
    updatedAccount = updatedAccount.toLowerCase()
    const user = userCollection.find(user => user.id === primaryAccount)
    if (user) {
        user.id = updatedAccount
        user.primaryAccount = updatedAccount
        user.accounts[updatedProvider] = [updatedAccount]
    }
    console.log('user :>> ', user)
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({
        message: 'Primary account updated',
        error: false,
        data: user
    })
})

export default router