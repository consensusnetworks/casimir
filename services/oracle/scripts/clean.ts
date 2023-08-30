import { run } from '@casimir/shell'

/**
 * Clean up resources
 */
void async function () {
    const resourceDir = 'scripts/resources'
    const stackName = 'rockx-dkg-cli'

    await run(`docker compose -p ${stackName} -f ${resourceDir}/rockx-dkg-cli/docker-compose.yaml down`)
}()