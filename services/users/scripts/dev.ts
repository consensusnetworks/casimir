import fs from 'fs'
import os from 'os'
import { run } from '@casimir/helpers'
import { JsonSchema, Schema, accountSchema, nonceSchema, userSchema, userAccountSchema } from '@casimir/data'

/**
 * Run a local users database and service
 */
void async function () {
    /** Resource path from package caller */
    const resourcePath = './scripts'

    /** All table schemas */
    const tableSchemas = {
        account: accountSchema,
        nonce: nonceSchema,
        user: userSchema,
        userAccount: userAccountSchema
    }

    /** Generate SQL schema */
    let sqlSchema = ''
    for (const table of Object.keys(tableSchemas)) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const postgresTable = schema.getPostgresTable()
        console.log(`${schema.getTitle()} JSON schema parsed to SQL`)
        sqlSchema += `${postgresTable}\n\n`
    }

    /** Write schema to ${resourcePath}/.out/sql/schema.sql */
    const sqlDir = `${resourcePath}/.out/sql`
    if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir, { recursive: true })
    fs.writeFileSync(`${sqlDir}/schema.sql`, sqlSchema)

    /** Start or sync database with latest schema */
    const stackName = 'casimir-users-db'
    await run(`docker compose -p ${stackName} -f ${resourcePath}/docker-compose.yaml up -d`)
    let dbReady = false
    while (!dbReady) {
        const health = await run('docker inspect --format=\'{{lower .State.Health.Status}}\' postgres') as string
        dbReady = health.trim() === 'healthy'
        await new Promise(resolve => setTimeout(resolve, 2500))
    }
    const atlasCli = await run('which atlas')
    if (!atlasCli) {
        if (os.platform() === 'darwin') {
            await run('echo y | brew install atlas')
        } else {
            await run('curl -sSf https://atlasgo.sh | sh')
        }
    }
    await run(`atlas schema apply --url "postgres://postgres:password@localhost:5432/users?sslmode=disable" --to "file://${sqlDir}/schema.sql" --dev-url "docker://postgres/15" --auto-approve`)
    
    /** Start users service */
    const usersReady = !(await fetch(`${process.env.PUBLIC_USERS_URL}/health`).catch(() => false))
    if (usersReady) {
        await run('ts-node-dev --watch ./src --respawn --transpile-only src/index.ts')
    }
}()