import fs from 'fs'
import { run } from '@casimir/helpers'
import { JsonSchema, Schema, accountSchema, nonceSchema, userSchema, userAccountSchema } from '@casimir/data'

/** Resource path from package caller */
const resourcePath = './scripts'

/** All table schemas */
const tableSchemas = {
    account: accountSchema,
    nonce: nonceSchema,
    user: userSchema,
    userAccount: userAccountSchema
}

/**
 * Run a local users database and service
 */
void async function () {
    const tables = ['account', 'nonce', 'user', 'userAccount']
    let sqlSchema = '-- Generated by @casimir/users/scripts/postgres.ts\n\n'
    for (const table of tables) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const postgresTable = schema.getPostgresTable()
        console.log(`${schema.getTitle()} JSON schema parsed to SQL`)
        sqlSchema += `${postgresTable}\n\n`
    }

    /** Write to sql file in ${resourcePath}/sql */
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
    if (!atlasCli) await run('echo y | brew install atlas')
    await run(`atlas schema apply --url "postgres://admin:password@localhost:5432/users?sslmode=disable" --to "file://${sqlDir}/schema.sql" --dev-url "docker://postgres/15" --auto-approve`)
    
    /** Start users service */
    const usersReady = !(await fetch(`${process.env.PUBLIC_USERS_URL}/health`).catch(() => false))
    if (usersReady) {
        await run('ts-node-dev --watch ./src --respawn --transpile-only src/index.ts')
    }
}()