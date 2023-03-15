import { run } from '@casimir/helpers'

/** Resource path from package caller */
const resources = './scripts'

/**
 * Clean local Postgres data and SQL schema files.
 */
void async function () {
    console.log(`Cleaning Postgres data and SQL schema files from ${resources}/.out`)
    
    /** Clear output directory for pgdata and sql */
    const outDir = `${resources}/.out`
    await run(`npx rimraf ${outDir}`)

    /** Stop postgres database */
    const container = await run('docker ps -q --filter name=postgres')
    if (container) {
        await run('docker stop postgres')
        await run('docker rm -f -v postgres')
        console.log('🐘 Database stopped')
    }
}()