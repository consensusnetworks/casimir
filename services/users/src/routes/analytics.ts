import express from 'express'

const router = express.Router()

router.get('/:userId', async (req: express.Request, res: express.Response) => {
    try {
        const { userId } = req.params
        console.log('userId in analytics/ :>> ', userId)
        const opt = {
            profile: 'consensus-networks-dev',
            database: 'casimir_analytics_database_dev',
            output: 's3://casimir-analytics-wallet-bucket-dev1/',
            workgroup: 'primary',
            catalog: 'AwsDataCatalog',
            backoff: 1000,
            region: 'us-east-2',
        }
        const stmt = `SELECT * FROM casimir_analytics_wallet_table_dev1 WHERE user_id = '${userId}' LIMIT 10;`
        import('../providers/athena-query/query').then(async ({ query }) => {
            const [columns, rows] = await query(stmt, opt)
            console.log('columns :>> ', columns)
            console.log('rows :>> ', rows)
            res.status(200).json(rows)
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