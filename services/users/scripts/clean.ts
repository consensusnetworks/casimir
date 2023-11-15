import { run } from "@casimir/shell"

/**
 * Clean up users resources
 */
void async function () {
    const resourceDir = "./scripts"
    const stackName = "casimir-users-db"
    await run(`rm -rf ${resourceDir}/.out`)
    await run(`docker compose -p ${stackName} -f ${resourceDir}/docker-compose.yaml down`)
}()