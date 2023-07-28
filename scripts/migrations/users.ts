import fs from 'fs'
import os from 'os'
import { JsonSchema, Schema, accountSchema, nonceSchema, userAccountSchema, userSchema } from '@casimir/data'
import { getSecret, run } from '@casimir/helpers'

void async function () {
    const project = process.env.PROJECT || 'casimir'
    const stage = process.env.STAGE || 'dev'
    const dbName = 'users'

    /** Load DB credentials */
    const dbCredentials = await getSecret(`${project}-${dbName}-db-credentials-${stage}`)

    /** Parse DB credentials */
    const { port, host, username, password } = JSON.parse(dbCredentials as string)
    const pgUrl = `postgres://${username}:${password}@${host}:${port}/${dbName}`

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

    const atlas = await run('which atlas') as string
    if (!atlas || atlas.includes('not found')) {
        if (os.platform() === 'darwin') {
            await run('echo y | brew install atlas')
        } else {
            throw new Error('Please install atlas using `curl -sSf https://atlasgo.sh | sh`')
        }
    }
    await run(`atlas schema apply --url "${pgUrl}?sslmode=disable" --to "file://${sqlDir}/schema.sql" --dev-url "docker://postgres/15" --auto-approve`)
}()