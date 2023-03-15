import minimist from 'minimist'
import fs from 'fs'
import { run } from '@casimir/helpers'
import { JsonSchema, Schema, accountSchema, nonceSchema, userSchema } from '@casimir/data'
import path from 'path'

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
 *     --tables: tables to deploy (optional, i.e., --tables=accounts,users)
 */
void async function () {

    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to all tables */
    const tables = argv.tables ? argv.tables.split(',') : ['accounts', 'nonces', 'users']
    let sqlSchema = '-- Generated by @casimir/data/scripts/postgres.ts\n\n'
    for (const table of tables) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const postgresTable = schema.getPostgresTable()
        console.log(`${schema.getTitle()} JSON schema parsed to SQL:\n`)
        console.log(`${postgresTable}\n`)
        sqlSchema += `DROP TABLE IF EXISTS ${table};\n`
        sqlSchema += `${postgresTable}\n\n`
    }

    /** Output directory for pgdata and sql */
    const outDir = `${resources}/.out`

    /** Put pgdata and sql schema files in output directory */
    const pgdataDir = `${outDir}/pgdata`
    const sqlDir = `${outDir}/sql`
    fs.mkdirSync(sqlDir, { recursive: true })
    fs.writeFileSync(`${sqlDir}/schema.sql`, sqlSchema)
    
    /** Start or sync database with latest schema */
    const container = await run('docker ps -q --filter name=postgres')
    if (!container) {
        await run(`docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -v ${path.resolve(pgdataDir)}:/var/lib/postgresql/data -v ${path.resolve(sqlDir)}:/docker-entrypoint-initdb.d -d postgres:latest`)
        console.log('🐘 Database started')
    } else {   
        await run('docker exec postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/schema.sql')
        console.log('🐘 Database synced')
    }
}()