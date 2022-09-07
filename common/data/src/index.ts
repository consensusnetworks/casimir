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

    const type = name === 'date' || name === 'first_staked_at' ? glue.Schema.DATE : glue.Schema[typeKey]

    const comment = property.description
    return { name, type, comment }
  })
}

export type EventTableColumn = {
  chain: string
  network: string
  provider: string
  type: string
  date: string
  address: string
  height: number
  to_address: string
  candidate: string
  candidate_list: string[]
  amount: number
  duration: number
  auto_stake: boolean
  // payload: Record<string, unknown>
}

// export type EventTableColumn = {
//   [key in keyof typeof eventSchema.properties]: // what goes here?
// export { eventSchema, aggSchema }