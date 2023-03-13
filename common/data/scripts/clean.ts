import minimist from 'minimist'
import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resources = './scripts'

/**
 * Clean local Docker Postgres environment, sql, and pgdata.
 * 
 * Arguments:
 * 
 *     --docker: whether to down Docker compose resources (i.e., --docker=false)
 */
void async function () {

    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to clean Docker resources */
    const docker = argv.docker !== false || argv.docker !== 'false'

    console.log(`Cleaning existing Postgres data and SQL schema from ${resources}/.out`)
    await run(`npx rimraf ${resources}/.out`)
    
    if (docker) {
        console.log(`Cleaning existing Docker resources from ${resources}`)
        await run(`docker compose -f ${resources}/docker-compose.yaml down -v`)
    }
}()