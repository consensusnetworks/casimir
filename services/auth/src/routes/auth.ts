import express from 'express'
const router = express.Router()

const userCollection = [
    {
      address: '0xd557a5745d4560b24d36a68b52351fff9c86a212',
      nonce: 0,
      message: 'I am Inigo Montoya. You killed my father. Prepare to die.',
    }
  ]

router.get('/:address', async (req: express.Request, res: express.Response) => {
    const { address } = req.params
    const user = userCollection.find(user => user.address === address)
    const message = user?.message
    if (user) {
        const nonce = user.nonce
        user.nonce++
        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.json({ nonce, message })
    } else {
        res.status(404)
        res.send()
    }
})

router.post('/:address', async (req: express.Request, res: express.Response) => {
    const { message } = req.body
    // Find user in collection and update the message
    const user = userCollection.find(user => user.address === req.params.address)
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