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

router.post('/add-sub-account', async (req: express.Request, res: express.Response) => {
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

router.post('/remove-sub-account', async (req: express.Request, res: express.Response) => {
    try {
        const { provider, address, token } = req.body
        let { primaryAddress } = req.body
        primaryAddress = primaryAddress.toLowerCase()
        const existingUser = userCollection.find(user => user.address === primaryAddress)
        let accountedRemoved = false
        if (existingUser) {
            existingUser.accounts = existingUser.accounts.filter(account => {
                const notAddress = account.walletProvider !== provider || account.address !== address || account.currency !== token
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

export default router