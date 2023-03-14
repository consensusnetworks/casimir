import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resources = './scripts'

/**
 * Clean local Docker Postgres environment, sql, and pgdata.
 */
void async function () {
    console.log(`Cleaning Docker services, Postgres data, and SQL schema files from ${resources}`)
    await run('docker compose -p casimir-data down -v')
    await run(`npx rimraf ${resources}/.out`)
}()