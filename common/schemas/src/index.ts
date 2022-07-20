import * as glue from '@aws-cdk/aws-glue-alpha'
import { JsonSchema } from './interfaces/JsonSchema'
import eventSchema from './lib/event.schema.json'
import aggSchema from './lib/agg.schema.json'

/**
 * Converts a JSON Schema object with table columns to an AWS Glue Schema object with AWS CDK Glue table columns.
 *
 * @param jsonSchema {JsonSchema} - Input JSON Schema object
 * @returns {glue.Column[]} AWS Glue Schema object to define table columns
 *
 */
 export function jsonToGlueSchema(jsonSchema: JsonSchema): glue.Column[] {
    return Object.keys(jsonSchema.properties).map((name: string) => {
      const property = jsonSchema.properties[name]
      const type = glue.Schema[property.type.toUpperCase() as keyof glue.Schema]
      const comment = property.description
      return { name, type, comment } 
    })
  }

export { eventSchema, aggSchema }