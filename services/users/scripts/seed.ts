import minimist from 'minimist'
import fs from 'fs'

/**
 * Seed the mock {'user' || 'account'}.store.json file to the users API /seed/{'user' || 'account'}s route.
 * 
 * Arguments:
 *     --resource: The resource to seed (defaults to 'user')
 *     --store: The directory containing the mock {'user' || 'account'}.store.json file (defaults to '../src/mock')
 */
void async function () {
    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default resource to user */
    const resource = argv.resource || 'user'
    
    /** Default store dir to ./src/mock */
    const store = argv.mock || './src/mock'

    /** Read store file */
    const storeFile = fs.readFileSync(`${store}/${resource}.store.json`, 'utf8')
    const resources = JSON.parse(storeFile)

    /** Seed resources with users API */
    const port = process.env.PUBLIC_USERS_PORT || 4000
    const seed = await fetch(`http://localhost:${port}/seed/${resource}s`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(resources)
    })
    const seededResources = await seed.json()
    console.log(`Seeded ${seededResources.length} ${resource}s to API`)
}()