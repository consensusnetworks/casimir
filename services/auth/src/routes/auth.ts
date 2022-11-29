import express from 'express'
import getMessage from '../helpers/getMessage'
import userCollection from '../collections/users'
const router = express.Router()

router.get('/:address', async (req: express.Request, res: express.Response) => {
    const { address } = req.params
    const message = getMessage(address)
    if (message) {
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({ message })
    } else {
        res.status(404)
        res.send()
    }
})

router.post('/:address', async (req: express.Request, res: express.Response) => {
    const { address } = req.params
    const { message } = req.body
    const user = userCollection.find(user => user.address === address)
    if (user) {
        user.message = message
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({
            message: `Message updated to: ${message}`,
            error: false
        })
    } else {
        res.status(404)
        res.json({
            message: 'User not found',
            error: true
        })
    }
})

export default router