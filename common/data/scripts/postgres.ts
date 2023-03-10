import minimist from 'minimist'
import fs from 'fs'
import { spawnPromise } from '@casimir/helpers'
import { JsonSchema, Schema, accountSchema, nonceSchema, userSchema } from '@casimir/data'

/** Directory path from package caller */
const resourceDir = './scripts'

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
 *     --clean: delete existing pgdata before deploy (optional, i.e., --clean)
 *     --tables: tables to deploy (optional, i.e., --tables=accounts,users)
 */
void async function () {

    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to keep data */
    const clean = argv.clean === true || argv.clean === 'true'

    /** Default to all tables */
    const tables = argv.tables ? argv.tables.split(',') : ['accounts', 'nonces', 'users']

    if (clean) {
        console.log('Cleaning existing PG services and data...')
        await spawnPromise(`docker compose -f ${resourceDir}/docker-compose.yaml down -v`)
        await spawnPromise('npm run clean --workspace @casimir/data')
    }

    for (const table of tables) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const pgTable = schema.getPgTable()
        console.log(`${schema.getTitle()} JSON schema parsed to SQL:`)
        console.log(pgTable)

        /** Write to sql file in ${resourceDir}/sql */
        const sqlDir = `${resourceDir}/.out/sql`
        if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir, { recursive: true })
        fs.writeFileSync(`${sqlDir}/${table}.sql`, pgTable)
    }
    
    /** Start local database */
    await spawnPromise(`docker compose -f ${resourceDir}/docker-compose.yaml up -d`)
}()