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

    if (name.endsWith('_at')) type = glue.Schema.TIMESTAMP

    if (name.endsWith('_list')) type = glue.Schema.array(glue.Schema.STRING)

    if (name.endsWith('amount')) type = glue.Schema.BIG_INT

    const comment = property.description
    return { name, type, comment }
  })
}

export type EventTableSchema = {
  /** Name of the chain (e.g. iotex, ethereum) */
  chain: string
  /** Name of the network (e.g. mainnet, testnet) */
  network: string
  /** "Name of the provider (e.g. casimir, infura, alchemy) */
  provider: string
  /** The type of event (e.g. block, transaction, deposit) */
  type: string
  /** The block height */
  height: number
  /** The block hash */
  block: string
  /** The transaction hash */
  transaction: string
  /** The date timestamp of the event in ISO 8601 format (e.g. 2015-03-04T22:44:30.652Z) */
  created_at: string
  /** The address which initiated the event, a miner in case of block and a caller in case of other events */
  address: string
  /** The recipient's address */
  to_address: string
  /** The amount value associated with the transaction */
  amount: string
  /** The total amount of gas used  */
  gasUsed: number
  /** The gas limit provided by transactions in the block */
  gasLimit: string
  /** Post-London upgrade this represents the minimum gasUsed multiplier required for a transaction to be included in a block */
  baseFee: string
  /** Post-London Upgrade, this represents the part of the tx fee that is burnt */
  burntFee: string
  /** The validator's address */
  validator: string
  /** The list of validators' addresses */
  validator_list: string[]
  /** The duration of the event */
  duration: number
  /** Is auto staking enabled */
  auto_stake: boolean
}

export { eventSchema, aggSchema }