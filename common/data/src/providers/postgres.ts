import { Pool, PoolConfig } from 'pg'

/**
 * Postgres database provider with pool client auto-connect-and-release
 */
export class Postgres {
    /** Postgres connection pool */
    private pool: Pool

    /**
     * Create a new Postgres database provider
     * @param {PoolConfig} config - Postgres connection pool config
     * @example
     * ```ts
     * const postgres = new Postgres()
     * ```
     */
    constructor(config?: PoolConfig) {
        this.pool = new Pool(config)
        process.on('SIGINT', () => this.close())
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
    async query(text: string, params: any[] = []) { // Todo - use union of stricter @casimir/types for params
        const client = await this.pool.connect()
        const res = await client.query(text, params)
        const { rows } = res
        client.release()
        return rows
    }

    /**
     * Close the connection pool (when the server exits)
     */
    async close() {
        await this.pool.end()
    }
}