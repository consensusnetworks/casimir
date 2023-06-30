import express from 'express'
import useDB from '../providers/db'
import { query } from 'athena-query'

const router = express.Router()

const { getUserById } = useDB()

router.get('/:userId', async (req: express.Request, res: express.Response) => {
    try {
        const { userId } = req.params
        const user = await getUserById(userId)
        const { accounts } = user
        const addresses = accounts.map((account) => account.address)
        const opt = {
            profile: 'consensus-networks-dev',
            database: 'casimir_analytics_database_dev',
            output: 's3://casimir-analytics-wallet-bucket-dev1/',
            workgroup: 'primary',
            catalog: 'AwsDataCatalog',
            backoff: 1000,
            region: 'us-east-2',
        }
        /**
         * Looks like we can query the following properties:
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
            SELECT * FROM casimir_analytics_database_dev.casimir_analytics_wallet_table_dev1
            WHERE wallet_address IN (${addresses.map((address) => `'${address}'`).join(',')})
            ORDER BY received_at DESC
            LIMIT 100
        `
        const [, rows] = await query(stmt, opt)
        console.log('rows :>> ', rows)
        res.status(200).json({
            error: false,
            message: 'analytics',
            data: rows
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