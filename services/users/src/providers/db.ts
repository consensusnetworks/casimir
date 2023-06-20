import { Postgres } from '@casimir/data'
import { camelCase } from '@casimir/helpers'
import { Account, RemoveAccountOptions, User, UserAddedSuccess } from '@casimir/types'
import useEthers from './ethers'

const { generateNonce } = useEthers()

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
     * @param createdAt - The account's creation date (optional)
     * @returns The new account
     */
    async function addAccount(account: Account, createdAt?: string) : Promise<Account> {
        if (!createdAt) createdAt = new Date().toISOString()
        const { address, currency, userId, walletProvider } = account
        const text = 'INSERT INTO accounts (address, currency, user_id, wallet_provider, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *;'
        const params = [address, currency, userId, walletProvider, createdAt]
        const rows = await postgres.query(text, params)
        const accountAdded = rows[0]
        const accountId = accountAdded.id
        await addUserAccount(parseInt(userId), accountId)
        return accountAdded as Account
    }

    /**
     * Add a user.
     * @param user - The user to add
     * @param account - The user's accounts
     * @returns The new user
     */
    async function addUser(user: User, account: Account) : Promise<UserAddedSuccess | undefined> {
        const { address, createdAt, updatedAt, walletProvider } = user
        const text = 'INSERT INTO users (address, created_at, updated_at, wallet_provider) VALUES ($1, $2, $3, $4) RETURNING *;'
        const params = [address, createdAt, updatedAt, walletProvider]
        const rows = await postgres.query(text, params)
        const addedUser = rows[0]
        account.userId = addedUser.id
        
        const accountAdded = await addAccount(account, createdAt)
        addedUser.accounts = [accountAdded]

        return formatResult(addedUser)
    }

    /**
     * Add a user account.
     * @param user_id - The user's id
     * @param account_id - The account's id
     * @returns The new user account
     */
    async function addUserAccount(user_id: number, account_id: number) {
        const createdAt = new Date().toISOString()
        const text = 'INSERT INTO user_accounts (user_id, account_id, created_at) VALUES ($1, $2, $3) RETURNING *;'
        const params = [user_id, account_id, createdAt]
        const rows = await postgres.query(text, params)
        return rows[0]
    }

    /**
     * Get accounts by address.
     * @param address - The account's address
     * @returns The account if found, otherwise undefined
     */
    async function getAccounts(address: string): Promise<Account[]> {
        const text = 'SELECT * FROM accounts WHERE address = $1;'
        const params = [address.toLowerCase()]
        const rows = await postgres.query(text, params)
        return formatResult(rows) as Account[]
    }

    /**
     * Get nonce by address.
     * @param address - The address user is using to sign in with ethereum
     * @returns - The nonce if address is a pk on the table or undefined
     */
    async function getNonce(address:string) {
        const text = 'SELECT nonce FROM nonces WHERE address = $1;'
        const params = [address]
        const rows = await postgres.query(text, params)
        const { nonce } = rows[0]
        return formatResult(nonce)
    }

    /**
     * Get a user by address.
     * @param address - The user's address
     * @returns The user if found, otherwise undefined
     */
    async function getUser(address: string) {
        try {
            const text = 'SELECT u.*, json_agg(a.*) AS accounts FROM users u JOIN user_accounts ua ON u.id = ua.user_id JOIN accounts a ON ua.account_id = a.id WHERE u.address = $1 GROUP BY u.id'
            const params = [address]
            const rows = await postgres.query(text, params)
            const user = rows[0]
            return formatResult(user) as User
        } catch (error) {
            throw new Error('There was an error getting user from the database')
        }
    }

    /**
     * Get a user by id.
     * @param id - The user's id
     * @returns The user if found, otherwise undefined
     * @throws Error if the user is not found
     */
    async function getUserById(id: string) {
        const text = 'SELECT u.*, json_agg(a.*) AS accounts FROM users u JOIN user_accounts ua ON u.id = ua.user_id JOIN accounts a ON ua.account_id = a.id WHERE u.id = $1 GROUP BY u.id'
        const params = [id]
        const rows = await postgres.query(text, params)
        const user = rows[0]
        if (!user) throw new Error('User not found')
        return formatResult(user) as User
    }

    /**
     * Remove an account.
     * @param address - The account's address (pk)
     * @param ownerAddress - The account's owner address
     * @param walletProvider - The account's wallet provider
     * @param currency - The account's currency
     * @returns The removed account if found, otherwise undefined
     */
    async function removeAccount({ address, currency, ownerAddress, walletProvider } : RemoveAccountOptions) {
        const text = 'DELETE FROM accounts WHERE address = $1 AND owner_address = $2 AND wallet_provider = $3 AND currency = $4 RETURNING *;'
        const params = [address, ownerAddress, walletProvider, currency]
        const rows = await postgres.query(text, params)
        return rows[0] as Account
    }

    /**
     * Update user's address based on userId.
     * @param userId - The user's id
     * @param address - The user's new address
     * @returns A promise that resolves when the user's address is updated
     * @throws Error if the user is not found
     * @throws Error if the user's address is not updated
     */
    async function updateUserAddress(userId: number, address: string): Promise<User> {
        try {
            const updated_at = new Date().toISOString()
            const text = 'UPDATE users SET address = $1, updated_at = $2 WHERE id = $3 RETURNING *;'
            const params = [address, updated_at, userId]
            const rows = await postgres.query(text, params)
            const user = rows[0]
            if (!user) throw new Error('User not found.')
            if (user.address !== address) throw new Error('User address not updated.')
            return user
        } catch (error) {
            console.error('There was an error updating the user address in updateUserAddress.', error)
            throw error
        }
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
     * Format data from a database result object (convert to camelCase).
     * @param rows - The result date
     * @returns The formatted data
     */
    function formatResult(result: any) {
        if (result) {
            for (const key in result) {
                result[camelCase(key)] = result[key]
                delete result[key]

                if (result[camelCase(key)].isArray()) {
                    result[camelCase(key)] = result[camelCase(key)].map((result: any) => {
                        return formatResult(result)
                    })
                }
            }
            return result
        }
    }

    return { 
        addAccount, 
        addUser, 
        getAccounts,
        getNonce, 
        getUser,
        getUserById,
        removeAccount, 
        updateUserAddress, 
        upsertNonce 
    }
}