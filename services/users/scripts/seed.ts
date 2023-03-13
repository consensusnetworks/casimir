import minimist from 'minimist'
import { userStore, accountStore } from '@casimir/data'
import { retry } from '@casimir/helpers'
import { Account, User } from '@casimir/types'

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

    /** Array of specified mock resources */
    const resources = ((resource: string) => {
        if (resource === 'account') return accountStore
        else if (resource === 'user') return userStore.map((user: User) => {
            return {
                ...user,
                accounts: accountStore.filter((account: Account) => account.ownerAddress === user.address)
            }
        })
    })(resource)

    const plural = resource + 's'

    if (resources?.length) {
        console.log(`Seeding ${resources.length} ${plural} with users API...`)
    
        /** Seed Account or User resources with users API */
        const port = process.env.PUBLIC_USERS_PORT || 4000
        const seed = await retry(`http://localhost:${port}/seed/${plural}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [plural]: resources })
        })
        const seededResources = await seed.json()
        console.log(`Seeded ${seededResources.length} ${plural} to API`)
        console.log(seededResources)
    } else {
        console.log(`No ${plural} to seed`)
    }
}()