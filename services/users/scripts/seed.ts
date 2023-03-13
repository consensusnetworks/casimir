import minimist from 'minimist'
import { userStore, accountStore } from '@casimir/data'

/**
 * Seed the mock {'user' || 'account'}.store.json file to the users API /seed/{'user' || 'account'}s route.
 * 
 * Arguments:
 *     --resource: The resource to seed (defaults to 'user')
 */
void async function () {
    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default resource to user */
    const resource = argv.resource || 'user'

    /** Array of Account or User resources */
    const resources = ((resource: string) => {
        if (resource === 'account') return accountStore
        else if (resource === 'user') userStore.map((user) => {
            return {
                ...user,
                accounts: accountStore.filter((account) => account.ownerAddress === user.address)
            }
        })
    })(resource)

    const plural = resource + 's'

    if (resources?.length) {
        console.log(`Seeding ${resources.length} ${plural} to API...`)
    
        /** Seed resources with users API */
        const port = process.env.PUBLIC_USERS_PORT || 4000
        const seed = await fetch(`http://localhost:${port}/seed/${plural}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [plural]: resources })
        })
        const seededResources = await seed.json()
        console.log(`Seeded ${seededResources.length} ${plural} to API`)
    } else {
        console.log(`No ${plural} to seed`)
    }
}()