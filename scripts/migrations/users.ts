import fs from "fs"
import os from "os"
import { JsonSchema, Schema, accountSchema, nonceSchema, operatorSchema, userAccountSchema, userSchema } from "@casimir/data"
import { run } from "@casimir/shell"
import { getSecret } from "@casimir/aws"

/**
 * Generate SQL schema from JSON schemas
 */
void async function () {
    const project = process.env.PROJECT || "casimir"
    const stage = process.env.STAGE || "dev"
    const dbName = "users"

    const dbCredentials = await getSecret(`${project}-${dbName}-db-credentials-${stage}`)

    const { port, host, username, password } = JSON.parse(dbCredentials as string)
    const pgUrl = `postgres://${username}:${password}@${host}:${port}/${dbName}`

    const resourceDir = "./scripts"

    const tableSchemas = {
        account: accountSchema,
        operator: operatorSchema,
        nonce: nonceSchema,
        user: userSchema,
        userAccount: userAccountSchema
    }
    
    let sqlSchema = ""
    for (const table of Object.keys(tableSchemas)) {
        const tableSchema = tableSchemas[table] as JsonSchema
        const schema = new Schema(tableSchema)
        const postgresTable = schema.getPostgresTable()
        console.log(`${schema.getTitle()} JSON schema parsed to SQL`)
        sqlSchema += `${postgresTable}\n\n`
    }

    const sqlDir = `${resourceDir}/.out/sql`
    if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir, { recursive: true })
    fs.writeFileSync(`${sqlDir}/schema.sql`, sqlSchema)

    const atlas = await run("which atlas") as string
    if (!atlas || atlas.includes("not found")) {
        if (os.platform() === "darwin") {
            await run("echo y | brew install atlas")
        } else {
            throw new Error("Please install atlas using `curl -sSf https://atlasgo.sh | sh`")
        }
    }
    await run(`atlas schema apply --url "${pgUrl}?sslmode=disable" --to "file://${sqlDir}/schema.sql" --dev-url "docker://postgres/15" --auto-approve`)
}()