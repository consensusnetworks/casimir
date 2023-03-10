import { spawnPromise } from '@casimir/helpers'

/** Resource path from package caller */
const resources = './scripts'

/**
 * Clean local Docker Postgres environment, sql, and pgdata.
 */
void async function () {
    console.log(`Cleaning existing PG services and data from ${resources}`)
    await spawnPromise(`docker compose -f ${resources}/docker-compose.yaml down -v`)
    await spawnPromise(`npx rimraf ${resources}/.out`)
}()