import express from 'express'
import userCollection from '../collections/users'
const router = express.Router()

router.put('/', async (req: express.Request, res: express.Response) => {
    let { primaryAccount, updatedAccount } = req.body
    primaryAccount = primaryAccount.toLowerCase()
    updatedAccount = updatedAccount.toLowerCase()
    const user = userCollection.find(user => user.address === primaryAccount)
    if (user) {
        if (!user.secondaryAccounts.includes(primaryAccount)) {
            user.secondaryAccounts.push(primaryAccount)
        }
        user.address = updatedAccount
        user.secondaryAccounts = user.secondaryAccounts.filter(account => account !== updatedAccount)
    }
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({
        message: 'Primary account updated',
        error: false,
        data: user
    })
})

export default router