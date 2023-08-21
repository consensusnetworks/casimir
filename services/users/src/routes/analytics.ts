import express from 'express'
import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import { SessionRequest } from 'supertokens-node/framework/express'
import useDB from '../providers/db'
import { query } from 'athena-query'

const router = express.Router()

const { formatResult, getUserById } = useDB()

router.get('/', verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        const id = req.session?.getUserId() as string
        const userId = id.toString()
        const user = await getUserById(userId)
        const { accounts } = user
        const addresses = accounts.map((account) => account.address)
        const database = 'casimir_analytics_database_dev'
        const athenaTable = 'casimir_analytics_action_table_dev1'
        const opt = {
            profile: process.env.AWS_PROFILE as string,
            database,
            output: 's3://casimir-analytics-wallet-bucket-dev1/',
            workgroup: 'primary',
            catalog: 'AwsDataCatalog',
            backoff: 1000,
            region: 'us-east-2',
        }
        /** 
         * Can query the following properties:
         * wallet_address
         * wallet_balance
         * tx_direction
         * tx_id
         * received_at
         * amount
         * price
         * gas_fee
         */
        const stmt = `
            SELECT * FROM ${database}.${athenaTable}
            WHERE address IN (${addresses.map((address) => `'${address}'`).join(',')})
            ORDER BY received_at DESC
            LIMIT 100
        `
        const { rows } = query(stmt, opt)
        const data = formatResult(rows)
        res.status(200).json({
            error: false,
            message: 'Analytics data successfully fetched.',
            data
        })
    } catch (err) {
        console.error('err :>> ', err)
        res.status(500).json({
            error: true,
            message: 'Server error.'
        })
    }
})

export default router