import minimist from 'minimist'
import fs from 'fs'
import { spawnPromise } from '@casimir/helpers'
import { JsonSchema, Schema, accountSchema, nonceSchema, userSchema } from '@casimir/data'

/** All table schemas */
const tableSchemas = {
    accounts: accountSchema,
    nonces: nonceSchema,
    users: userSchema
}

/**
 * Run a local postgres database with the given tables
 * 
 * Arguments:
 *     --clean: delete existing pgdata before deploy (optional, i.e., --clear)
 *     --tables: tables to deploy (optional, i.e., --tables=accounts,users)
 */
void async function () {

    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to keep data */
    const clean = argv.clean === true || argv.clean === 'true'
    if (clean) {
        console.log('Cleaning existing PG services and data...')
        await spawnPromise('docker compose -f ./scripts/docker-compose.yaml down -v')
        await spawnPromise('npm run clean --workspace @casimir/data')
    }

    /** Default to all tables */
    const tables = argv.tables ? argv.tables.split(',') : ['accounts', 'nonces', 'users']
    for (const table of tables) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const pgTable = schema.getPgTable()
        console.log(pgTable)

        /** Write to sql file in ./scripts/sql */
        const sqlDir = './scripts/sql'
        if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir)
        fs.writeFileSync(`${sqlDir}/${table}.sql`, pgTable)
    }
    
    /** Start local database */
    await spawnPromise('docker compose -f ./scripts/docker-compose.yaml up -d')
}()