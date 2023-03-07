import { $, argv } from 'zx'

/**
 * Run a local postgres server
 * 
 * Arguments:
 *     --tables: tables to create (optional, i.e., --tables=users,accounts)
 */
void async function() {

    /** Default to no tables */
    const tables = argv.tables ? argv.tables.split(',') : []

    const password = 'password'
    process.env.POSTGRES_PASSWORD = password
    await $`docker pull postgres`
    $`docker run --rm --name postgres -e POSTGRES_PASSWORD=${password} -p 5432:5432 -d postgres`

    // /** Wait for postgres to start and add tables */
    // if (tables) {
    //     await $`sleep 5`
    //     for (const table of tables) {
    //         await $`psql -h localhost -U postgres -f scripts/db/${table}.sql`
    //     }
    // }
}