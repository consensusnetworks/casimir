import { $, argv, echo, fs } from 'zx'
import { Schema, accountSchema, userSchema } from '@casimir/data'

/** Casimir table schemas */
const tableSchemas = {
    accounts: accountSchema,
    users: userSchema
}

/**
 * Run a local instance of the Casimir PG database
 * 
 * Arguments:
 *     --tables: tables to deploy (optional, i.e., --tables=accounts,users)
 */
void async function () {

    /** Default to all Casimir tables */
    const tables = argv.tables ? argv.tables.split(',') : ['accounts', 'users']

    // /** Start local database */
    // const password = process.env.DB_PASSWORD || 'password'
    // await $`docker pull postgres`
    // $`docker run --rm --name postgres -e POSTGRES_PASSWORD=${password} -p 5432:5432 -d postgres`

    /** Deploy tables */
    for (const table of tables) {
        const tableSchema = tableSchemas[table]
        const schema = new Schema(tableSchema)
        const pgTable = schema.getPgTable()
        echo(pgTable)

        /** Write to sql file */
        if (!fs.existsSync('./scripts/local/data')) fs.mkdirSync('./scripts/local/data')
        fs.writeFileSync(`./scripts/local/data/${table}.sql`, pgTable)
    }
}()