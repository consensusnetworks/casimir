import fs from 'fs'
import os from 'os'
import { run, getSecret, loadCredentials } from '@casimir/helpers'
import { JsonSchema, Schema, accountSchema, nonceSchema, userSchema, userAccountSchema } from '@casimir/data'

/**
 * Run a local users database and service
 */
void async function () {

    /** Load credentials and get secrets for non-local config */
    if (process.env.STAGE !== 'local') {
        await loadCredentials()
        const dbCredentials = await getSecret(`${process.env.PROJECT}-users-db-credentials-${process.env.STAGE}`)
        const { port: dbPort, host: dbHost, dbname: dbName, username: dbUser, password: dbPassword } = JSON.parse(dbCredentials as string)
        process.env.DB_HOST = dbHost
        process.env.DB_PORT = dbPort
        process.env.DB_NAME = dbName
        process.env.DB_USER = dbUser
        process.env.DB_PASSWORD = dbPassword
        const sessionsCredentials = await getSecret(`${process.env.PROJECT}-sessions-credentials-${process.env.STAGE}`)
        const { host: sessionsHost, key: sessionsKey } = JSON.parse(sessionsCredentials as string)
        process.env.SESSIONS_HOST = sessionsHost
        process.env.SESSIONS_KEY = sessionsKey
    }

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
    const atlas = await run('which atlas') as string
    if (atlas.includes('not found')) {
        await run('curl -sSf https://atlasgo.sh | sh -s -- --yes')
    }
    await run(`atlas schema apply --url "postgres://postgres:password@localhost:5432/users?sslmode=disable" --to "file://${sqlDir}/schema.sql" --dev-url "docker://postgres/15" --auto-approve`)
}()