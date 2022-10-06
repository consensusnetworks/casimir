import * as glue from '@aws-cdk/aws-glue-alpha'
import { JsonSchema } from './interfaces/JsonSchema'
import eventSchema from './schemas/event.schema.json'
import aggSchema from './schemas/agg.schema.json'

/**
 * Converts a JSON Schema table object to an array of Glue columns.
 *
 * @param jsonSchema {JsonSchema} - Input JSON Schema table object 
 * @returns {glue.Column[]} Array of Glue columns
 *
 */
export function schemaToGlueColumns(jsonSchema: JsonSchema): glue.Column[] {
  return Object.keys(jsonSchema.properties).map((name: string) => {
    const property = jsonSchema.properties[name]

    // 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DOUBLE' | 'DECIMAL' | 'BIGINT' | 'TIMESTAMP' | 'JSON' | 'DATE' 
    const typeKey = property.type.toUpperCase() as keyof glue.Schema

    let type: glue.Type = glue.Schema[typeKey]

    if (name.endsWith('at')) type = glue.Schema.TIMESTAMP

    if (name.endsWith('_list')) type = glue.Schema.array(glue.Schema.STRING)

    if (name.endsWith('amount')) type = glue.Schema.BIG_INT

    const comment = property.description
    return { name, type, comment }
  })
}

export type EventTableColumn = {
  chain: string
  network: string
  provider: string
  type: string
  height: number
  block: string
  transaction: string
  created_at: string
  address: string
  to_address: string
  validator: string
  validator_list: string[]
  amount: string
  duration: number
  auto_stake: boolean
}
export { eventSchema, aggSchema }