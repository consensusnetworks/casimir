import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resourcePath = './scripts'

/**
 * Clean up resources
 */
void async function () {
    await run(`rm -rf ${resourcePath}/.out`)
    await run(`docker compose -p casimir-data -f ${resourcePath}/docker-compose.yaml down`)
}()