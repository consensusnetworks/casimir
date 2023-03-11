import * as glue from '@aws-cdk/aws-glue-alpha'
import { JsonSchema } from '../interfaces/JsonSchema'

export type JsonType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
export type GlueType = glue.Type
export type PostgresType = 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DOUBLE' | 'DECIMAL' | 'BIGINT' | 'TIMESTAMP' | 'JSON' | 'DATE'

export class Schema {
    /** Input JSON schema object */
    private jsonSchema: JsonSchema

    /**
     * @param jsonSchema {JsonSchema} - Input JSON schema object
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
     * Get an array of Glue columns from the JSON schema object.
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
     * Get a PG table from the JSON schema object.
     * @returns {string} PG table
     * 
     * @example
     * ```typescript
     * const schema = new Schema(jsonSchema)
     * const table = schema.getPostgresTable()
     * ```
     */
    getPostgresTable(): string {
        const columns = Object.keys(this.jsonSchema.properties).map((name: string) => {
            const property = this.jsonSchema.properties[name]
            let type = {
                string: 'VARCHAR',
                number: 'DOUBLE',
                integer: 'INTEGER',
                boolean: 'BOOLEAN',
                object: 'JSON',
                array: 'JSON',
                null: 'VARCHAR'
            }[property.type as JsonType] as PostgresType

            if (name.endsWith('_at')) type = 'TIMESTAMP'
            if (name.includes('balance')) type = 'BIGINT'

            let column = `${name} ${type}`

            const comment = property.description
            if (comment.includes('PK')) column += ' PRIMARY KEY'
            
            return column
        })

        /** Make table name plural of schema objects (todo: check edge-cases) */
        const tableName = this.jsonSchema.title.toLowerCase() + 's'

        return `CREATE TABLE ${tableName} (\n\t${columns.join(',\n\t')}\n);`
    }

    /**
     * Get the title of the JSON schema object.
     */
    getTitle(): string {
        return this.jsonSchema.title
    }
}