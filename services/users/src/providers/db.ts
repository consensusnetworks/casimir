import { Postgres } from '@casimir/data'
import { pascalCase, snakeCase } from '@casimir/helpers'
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

        const text = 'INSERT INTO users (address, created_at) VALUES ($1, $2) RETURNING *;'
        const params = [user.address, createdAt]
        const rows = await postgres.query(text, params)

        const addedUser = rows[0]
        addedUser.accounts = []

        for (const account of user.accounts || []) {
            const text = 'INSERT INTO accounts (address, owner_address, created_at) VALUES ($1, $2, $3) RETURNING *;'
            const params = [account.address, user.address, createdAt]
            const rows = await postgres.query(text, params)
            const addedAccount = rows[0]
            addedUser.accounts.push(addedAccount)
        }
        return formatResult(addedUser) as User
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
        const user = rows[0]
        return formatResult(user) as User
    }

    /**
     * Format data from a database result (snake_case to PascalCase).
     * @param rows - The result date
     * @returns The formatted data
     */
    function formatResult(row: any) {
        if (row) {
            for (const key in row) {
                /** Convert snake_case to PascalCase */
                if (key.includes('_')) row[pascalCase(key)] = row[key]
                delete row[key]
            }
            return row
        }
    }

    return { addAccount, addUser, getUser }
}