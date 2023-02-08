import express from 'express'
import { userCollection } from '../collections/users'
const router = express.Router()

router.put('/update-primary-account', async (req: express.Request, res: express.Response) => {
    let { primaryAccount, updatedProvider, updatedAccount } = req.body
    primaryAccount = primaryAccount.toLowerCase()
    updatedProvider = updatedProvider.toLowerCase()
    updatedAccount = updatedAccount.toLowerCase()
    const user = userCollection.find(user => user.address === primaryAccount)
    if (user) {
        user.address = updatedAccount
    }
    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.json({
        message: 'Primary account updated',
        error: false,
        data: user
    })
})

router.put('/add-account', async (req: express.Request, res: express.Response) => {
    try {
        const { user } = req.body
        let { primaryAddress } = req.body
        primaryAddress = primaryAddress.toLowerCase()
        const existingUser = userCollection.find(user => user.address === primaryAddress)
        if (existingUser) {
            existingUser.accounts = user.accounts
        }
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

export default router