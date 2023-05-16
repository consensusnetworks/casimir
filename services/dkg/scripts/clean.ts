import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resourcePath = 'scripts/resources/rockx-dkg-cli'

/**
 * Clean up resources
 */
void async function () {
    await run(`docker compose -f ${resourcePath}/docker-compose.yaml down`)
}()