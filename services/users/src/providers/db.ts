import { Postgres } from '@casimir/data'
import { pascalCase } from '@casimir/helpers'
import { Account, User, UserAddedSuccess } from '@casimir/types'

const postgres = new Postgres({
    // These will become environment variables
    host: 'localhost',
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
     * @param account - The user's accounts
     * @returns The new user
     */
    async function addUser(user: User, account: Account) : Promise<UserAddedSuccess | undefined> {
        const { address, createdAt, updatedAt } = user
        const text = 'INSERT INTO users (address, created_at, updated_at) VALUES ($1, $2, $3) RETURNING *;'
        const params = [address, createdAt, updatedAt]
        const rows = await postgres.query(text, params)

        const addedUser = rows[0]
        
        const { address: accountAddress, ownerAddress, walletProvider } = account
        const accountText = 'INSERT INTO accounts (address, owner_address, wallet_provider, created_at) VALUES ($1, $2, $3, $4) RETURNING *;'
        const accountParams = [accountAddress, ownerAddress, walletProvider, createdAt]
        const accountRows = await postgres.query(accountText, accountParams)
        const addedAccount = accountRows[0]
        addedUser.accounts = [addedAccount]
        return formatResult(addedUser)
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
     * Add or update nonce for an address.
     * @param address - The address
     * @returns A promise that resolves when the nonce is added or updated
     */
    async function upsertNonce(address: string): Promise<string | Error> {
        try {
            const nonce = generateNonce()
            const text = 'INSERT INTO nonces (address, nonce) VALUES ($1, $2) ON CONFLICT (address) DO UPDATE SET nonce = $2;'
            const params = [address, nonce]
            await postgres.query(text, params)
            return nonce
        } catch (error) {
            console.error('There was an error adding or updating the nonce in upsertNonce.', error)
            return error as Error
        }
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
                if (key.includes('_')) {
                    row[pascalCase(key)] = row[key]
                    delete row[key]
                } else {
                    row[key[0].toUpperCase() + key.slice(1)] = row[key]
                    delete row[key]
                }
            }
            return row
        }
    }

    return { addAccount, addUser, getUser, upsertNonce }
}

/**
 * Generate and return a nonce.
 * @returns string
 */
function generateNonce() {
    return (Math.floor(Math.random()
        * (Number.MAX_SAFE_INTEGER - 1)) + 1).toString()
}