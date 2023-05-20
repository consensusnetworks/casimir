import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resourcePath = 'scripts/resources/rockx-dkg-cli'

/** Compose stack name */
const stackName = 'rockx-dkg-cli'

/**
 * Clean up resources
 */
void async function () {
    await run(`docker compose -p ${stackName} -f ${resourcePath}/docker-compose.yaml down`)
}()