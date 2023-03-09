import { Pool } from 'pg'
import { pascalCase } from '@casimir/helpers'

export class Postgres {
    /** Postgres connection pool */
    private pool: Pool

    constructor() {
        this.pool = new Pool({ // These will become environment variables
            host: '0.0.0.0',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: 'postgres'
        })
        process.on('exit', () => this.close())
    }

    /**
     * Query the database (with pool client auto-connect-and-release)
     * @param text SQL query
     * @param params Query parameters
     * @returns Query result
     * 
     * @example
     * ```ts
     * const pg = new Postgres()
     * const res = await pg.query('SELECT $1::text as message', ['Hello world!'])
     * console.log(res.rows[0].message) // Hello world!
     * ```
     */
    async query(text: string, params: any[] = []) { // Todo - use strict @casimir/types for params
        const client = await this.pool.connect()
        const res = await client.query(text, params)
        console.log('Result:', res)
        const { rows } = res

        /** Convert snake_case to PascalCase */
        for (const row of rows) {
            for (const key in row) {
                if (key.includes('_')) row[key] = pascalCase(key)
            }
        }
        
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