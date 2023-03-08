import * as glue from '@aws-cdk/aws-glue-alpha'
import { JsonSchema } from '../interfaces/JsonSchema'

export type JsonType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
export type GlueType = glue.Type
export type PgType = 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DOUBLE' | 'DECIMAL' | 'BIG_INT' | 'TIMESTAMP' | 'JSON' | 'DATE'

export class Schema {
    /** Input JSON Schema object */
    private jsonSchema: JsonSchema

    /**
     * Schema constructor
     * @param jsonSchema {JsonSchema} - Input JSON Schema object
     * 
     * @example
     * ```typescript
     * import { eventSchema } from '@casimir/data'
     * const schema = new Schema(eventSchema)
     * ```
     */
    constructor(jsonSchema: JsonSchema) {
        this.jsonSchema = jsonSchema
    }

    /**
     * Get an array of Glue columns from the JsonSchema object
     * @returns {glue.Column[]} Array of Glue columns
     * 
     * @example
     * ```typescript
     * const schema = new Schema(jsonSchema)
     * const columns = schema.getGlueColumns()
     * ```
     */
    getGlueColumns(): glue.Column[] {
        return Object.keys(this.jsonSchema.properties).map((name: string) => {
            const property = this.jsonSchema.properties[name]

            // 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DOUBLE' | 'DECIMAL' | 'BIG_INT' | 'TIMESTAMP' | 'JSON' | 'DATE'
            const typeKey = property.type.toUpperCase() as keyof glue.Schema

            let type: GlueType = glue.Schema[typeKey]

            if (name.endsWith('_at')) type = glue.Schema.TIMESTAMP
            if (name.endsWith('_balance')) type = glue.Schema.BIG_INT
            if (name == 'amount') type = glue.Schema.BIG_INT
            if (name === 'price') type = glue.Schema.FLOAT

            const comment = property.description
            return { name, type, comment }
        })
    }

    /**
     * Get a PG table from the JsonSchema object.
     * @returns {string} PG table
     * 
     * @example
     * ```typescript
     * const schema = new Schema(jsonSchema)
     * const table = schema.getPgTable()
     * ```
     */
    getPgTable(): string {
        const columns = Object.keys(this.jsonSchema.properties).map((name: string) => {
            const property = this.jsonSchema.properties[name]

            let type = {
                string: 'STRING',
                number: 'DOUBLE',
                integer: 'INTEGER',
                boolean: 'BOOLEAN',
                object: 'JSON',
                array: 'JSON',
                null: 'STRING'
            }[property.type as JsonType] as PgType

            if (name.endsWith('_at')) type = 'TIMESTAMP'
            if (name.endsWith('_balance')) type = 'BIG_INT'

            let column = `${name} ${type}`

            const comment = property.description
            if (comment.includes('PK')) column += ' PRIMARY KEY'
            
            return column
        })

        return `CREATE TABLE [IF NOT EXISTS] ${this.jsonSchema.title} (\n\t${columns.join(',\n\t')}\n);`
    }
}