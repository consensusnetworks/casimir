import { Pool, PoolConfig } from "pg"

/**
 * Postgres database provider with pool client auto-connect-and-release
 */
export class Postgres {
    /** Postgres connection pool */
    private pool: Pool

    /**
     * Create a new Postgres database provider
     */
    constructor(poolConfig: PoolConfig) {
        this.pool = new Pool(poolConfig)
    }

    /**
     * Query the database
     * @param text SQL query
     * @param params Query parameters
     * @returns Query result
     * 
     * @example
     * ```ts
     * const { rows } = await postgres.query('SELECT * FROM messages WHERE text = $1', ['Hello world!'])
     * if (rows.length) console.log(rows[0].text) // Hello world!
     * ```
     */
    async query(text: string, params: any[] = []) {
        const client = await this.pool.connect()
        const res = await client.query(text, params)
        client.release()
        const { rows } = res
        return rows
    }
}