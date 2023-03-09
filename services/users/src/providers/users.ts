import { userCollection } from '../collections/users'
import { Postgres } from './postgres'
import { ProviderString } from '@casimir/types'
import { User } from '@casimir/types'


export default function useUsers() {
    async function getUser(address: string) {
        const pg = new Postgres()
        const text = 'SELECT u.*, json_agg(a.*) AS accounts FROM users u JOIN accounts a ON u.address = a.owner_address WHERE u.address = $1 GROUP BY u.address'
        const params = [address]
        const rows = await pg.query(text, params)
        if (rows.length) {
            const user: User = rows[0]
            return user
        }
    }

    function getMessage (address: string) {
        const user = userCollection.find(user => user.address === address)
        if (user) {
            return user.nonce
        }
        return ''
    }

    function updateMessage (provider: ProviderString, address: string) {
        const user = userCollection.find(user => user.address === address)
        provider = provider.toString().toLowerCase()
        if (user) {
            user.nonce = generateNonce()
        } else {
            console.log('Create new user here?')
            const user: User = {
                address,
                nonce: generateNonce(),
                pools: []
            }
            userCollection.push(user)
        }
    }
    
    function generateNonce() {
        return (Math.floor(Math.random()
            * (Number.MAX_SAFE_INTEGER - 1)) + 1).toString()
    }
    
    return { getUser, getMessage, updateMessage, generateNonce }
}