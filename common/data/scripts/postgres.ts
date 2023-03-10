import minimist from 'minimist'
import fs from 'fs'
import { spawnPromise } from '@casimir/helpers'
import { JsonSchema, Schema, accountSchema, nonceSchema, userSchema } from '@casimir/data'

/** Resource path from package caller */
const resources = './scripts'

/** All table schemas */
const tableSchemas = {
    accounts: accountSchema,
    nonces: nonceSchema,
    users: userSchema
}

/**
 * Run a local postgres database with the given tables.
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
        await spawnPromise('npm run clean:postgres --workspace @casimir/data')
    }

    for (const table of tables) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const pgTable = schema.getPgTable()
        console.log(`${schema.getTitle()} JSON schema parsed to SQL:`)
        console.log(pgTable)

        /** Write to sql file in ${resources}/sql */
        const sqlDir = `${resources}/.out/sql`
        if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir, { recursive: true })
        fs.writeFileSync(`${sqlDir}/${table}.sql`, pgTable)
    }
    
    /** Start local database */
    await spawnPromise(`docker compose -f ${resources}/docker-compose.yaml up -d`)
}()