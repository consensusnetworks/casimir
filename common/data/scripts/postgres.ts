import minimist from 'minimist'
import fs from 'fs'
import { run } from '@casimir/helpers'
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
 *     --clean: clean the database before starting (optional, i.e., --clean)
 *     --tables: tables to deploy (optional, i.e., --tables=accounts,users)
 */
void async function () {

    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to clean services and data */
    const clean = argv.clean !== 'false' || argv.clean !== false

    /** Default to all tables */
    const tables = argv.tables ? argv.tables.split(',') : ['accounts', 'nonces', 'users']

    /** Write to sql file in ${resources}/sql */
    if (clean) {
        await run('npm run clean --workspace @casimir/data')
    }
    const sqlDir = `${resources}/.out/sql`
    if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir, { recursive: true })
    for (const table of tables) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const postgresTable = schema.getPostgresTable()
    
        console.log(`${schema.getTitle()} JSON schema parsed to SQL:`)
        console.log(postgresTable)
        console.log('Output to', `${sqlDir}/${table}.sql`)

        fs.writeFileSync(`${sqlDir}/${table}.sql`, postgresTable)
    }
    
    /** Start local database */
    await run(`docker compose -p casimir-data -f ${resources}/docker-compose.yaml up -d`)
}()