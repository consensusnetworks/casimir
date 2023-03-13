import express from 'express'
// import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import { SessionRequest } from 'supertokens-node/framework/express'
import useDB from '../providers/db'

const router = express.Router()
const { addUser } = useDB()

router.post('/users'/*, verifySession()*/, async (req: SessionRequest, res: express.Response) => {
    console.log('SEEDING USERS')
    const { users } = req.body
    for (const user of users) {
        await addUser(user)
    }
    res.status(200).json(users)
})

export default router


