import express from 'express'
import { SessionRequest } from 'supertokens-node/framework/express'
import useDB from '../providers/db'

const router = express.Router()
const { addUser } = useDB()

router.post('/users'/*, verifySession()*/, async (req: SessionRequest, res: express.Response) => {
    const { users } = req.body
    for (const user of users) {
        await addUser(user, user.accounts[0])
    }
    res.status(200).json(users)
})

export default router


