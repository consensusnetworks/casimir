import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resourcePath = './scripts'

/**
 * Clean Docker containers, Postgres data, and SQL schema files.
 */
void async function () {
    console.log(`Cleaning up Docker containers, Postgres data, and SQL schema files from ${resourcePath}/.out`)

    /** Stop postgres database */
    const stackName = 'casimir-data'
    const containerName = `${stackName}-postgres-1`
    const container = await run(`docker ps -q --filter name=${containerName}`)
    if (container) {
        await run(`docker compose -p ${stackName} -f ${resourcePath}/docker-compose.yaml down`)
    }

    /** Clear output directory for pgdata and sql */
    const outDir = `${resourcePath}/.out`
    await run(`npx rimraf ${outDir}`)

    console.log('🐘 Database resources cleaned')
}()