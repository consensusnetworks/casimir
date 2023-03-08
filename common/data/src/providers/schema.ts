import * as glue from '@aws-cdk/aws-glue-alpha'
import { JsonSchema } from '../interfaces/JsonSchema'

export class Schema {
    private jsonSchema: JsonSchema

    /**
     * Schema constructor
     * @param jsonSchema {JsonSchema} - Input JSON Schema table object
     * 
     * @example
     * ```typescript
     * const schema = new Schema(jsonSchema)
     * ```
     */
    constructor(jsonSchema: JsonSchema) {
        this.jsonSchema = jsonSchema
    }

    /**
     * Converts the JsonSchema table object to an array of Glue columns.
     * @param jsonSchema {JsonSchema} - Input JSON Schema table object
     * @returns {glue.Column[]} Array of Glue columns
     * 
     * @example
     * ```typescript
     * const schema = new Schema(jsonSchema)
     * const columns = schema.toGlueColumns()
     * ```
     */
    toGlueColumns(): glue.Column[] {
        return Object.keys(this.jsonSchema.properties).map((name: string) => {
            const property = this.jsonSchema.properties[name]

            // 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DOUBLE' | 'DECIMAL' | 'BIG_INT' | 'TIMESTAMP' | 'JSON' | 'DATE'
            const typeKey = property.type.toUpperCase() as keyof glue.Schema

            let type: glue.Type = glue.Schema[typeKey]

            if (name.endsWith('_at')) type = glue.Schema.TIMESTAMP
            if (name.endsWith('_balance')) type = glue.Schema.BIG_INT
            if (name == 'amount') type = glue.Schema.BIG_INT
            if (name === 'price') type = glue.Schema.FLOAT

            const comment = property.description
            return { name, type, comment }
        })
    }
}