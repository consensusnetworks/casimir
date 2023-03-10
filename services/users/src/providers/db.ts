import { Postgres } from '@casimir/data'
import { Account, User } from '@casimir/types'

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
     * Add an account.
     * @param account - The account to add
     * @returns The new account
     */
    async function addAccount(account: Account) {
        const createdAt = new Date().toISOString()
        console.log('createdAt', createdAt)
        const text = 'INSERT INTO accounts (address, owner_address, created_at) VALUES ($1, $2, $3) RETURNING *;'
        const params = [account.address, account.ownerAddress, createdAt]
        const rows = await postgres.query(text, params)
        return rows[0] as Account
    }

    /**
     * Add a user.
     * @param user - The user to add
     * @returns The new user
     */
    async function addUser(user: User) {
        const createdAt = new Date().toISOString()
        console.log('createdAt', createdAt)
        const text = 'INSERT INTO users (address, created_at) VALUES ($1, $2) RETURNING *;'
        const params = [user.address, createdAt]
        const rows = await postgres.query(text, params)
        return rows[0] as User
    }

    /**
     * Get a user by address.
     * @param address - The user's address
     * @returns The user if found, otherwise undefined
     */
    async function getUser(address: string) {
        const text = 'SELECT u.*, json_agg(a.*) AS accounts FROM users u JOIN accounts a ON u.address = a.owner_address WHERE u.address = $1 GROUP BY u.address'
        const params = [address]
        const rows = await postgres.query(text, params)
        if (rows.length) return rows[0] as User
    }

    return { addAccount, addUser, getUser }
}