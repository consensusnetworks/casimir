import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resourcePath = './scripts'

/** Compose stack name */
const stackName = 'casimir-data'

/**
 * Clean up resources
 */
void async function () {
    await run(`rm -rf ${resourcePath}/.out`)
    await run(`docker compose -p ${stackName} -f ${resourcePath}/docker-compose.yaml down`)
}()