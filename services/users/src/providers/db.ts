import { Postgres } from '@casimir/data'
import { User } from '@casimir/types'

const postgres = new Postgres({
    // These will become environment variables
    host: '0.0.0.0',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
})

export default function useDB() {

    /**
     * Get a user by address
     * @param address - The user's address
     * @returns 
     */
    async function getUser(address: string) {
        const text = 'SELECT u.*, json_agg(a.*) AS accounts FROM users u JOIN accounts a ON u.address = a.owner_address WHERE u.address = $1 GROUP BY u.address'
        const params = [address]
        const rows = await postgres.query(text, params)
        if (rows.length) return rows[0] as User
    }

    return { getUser }
}