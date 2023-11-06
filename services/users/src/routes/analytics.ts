import express from "express"
import { verifySession } from "supertokens-node/recipe/session/framework/express"
import { SessionRequest } from "supertokens-node/framework/express"
import useDB from "../providers/db"
import { query } from "athena-query"
import { UserWithAccountsAndOperators } from "@casimir/types"

const router = express.Router()

const { formatResult, getUserById } = useDB()

router.get("/", verifySession(), async (req: SessionRequest, res: express.Response) => {
    try {
        console.log("got to athena route")
        // Two tables
        // Events
        // any events on the blockchain (including the block itself)
        // so all txs + 1 for block
        // Athena currently has all of this Goerli tx data 
        // Actions <-- this is the one we want for Overview Chart
        // contract data (StakeDeposited, Withdrawal, etc.)
        // includes tx data (outgoing, incoming, etc.)
        const id = req.session?.getUserId() as string
        const userId = id.toString()
        const user = await getUserById(userId)
        const { accounts } = user as UserWithAccountsAndOperators
        const addresses = accounts.map((account) => account.address)
        const database = "casimir_analytics_database_dev"
        const athenaTable = "casimir_analytics_action_table_dev1"
        const opt = {
            profile: process.env.AWS_PROFILE as string,
            database,
            // output: 's3://casimir-analytics-wallet-bucket-dev1/',
            output: "s3://casimir-analytics-action-bucket-dev1/",
            workgroup: "primary",
            catalog: "AwsDataCatalog",
            backoff: 1000,
            region: "us-east-2",
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
        // TODO: Include type in WHERE to decrease query time
        // const testStmt = 'SELECT * FROM "casimir_analytics_action_table_dev1" limit 10;'
        // const stmt = `
        //     SELECT * FROM ${database}.${athenaTable}
        //     WHERE address IN (${addresses.map((address: string) => `'${address}'`).join(',')})
        //     ORDER BY received_at DESC
        //     LIMIT 100;
        // `
        // const { rows } = await query(testStmt, opt)
        // console.log('rows :>> ', rows)
        console.log("addresses :>> ", addresses)
        const stmt = `SELECT * FROM "casimir_analytics_database_dev"."casimir_analytics_action_table_dev1" 
            WHERE "address" IN (${addresses.map((address: string) => `'${address}'`).join(",")})
            ORDER BY received_at DESC
            LIMIT 100;`
        const [columns, rows ] = await query(stmt, {
            database: "casimir_analytics_database_dev",
            workgroup: "primary",
            profile: "consensus-networks-dev",
            output: "s3://cms-lds-agg/cms_hcf_aggregates/",
            catalog: "AwsDataCatalog",
            backoff: 1000,
            region: "us-east-2",
        })
        const data = formatResult(rows)
        console.log("data :>> ", data)
        res.status(200).json({
            error: false,
            message: "Analytics data successfully fetched.",
            data
        })
    } catch (err) {
        console.error("err :>> ", err)
        res.status(500).json({
            error: true,
            message: "Server error."
        })
    }
})

export default router