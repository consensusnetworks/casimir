import * as glue from '@aws-cdk/aws-glue-alpha'
import { JsonSchema } from './interfaces/JsonSchema'
import eventSchema from './schemas/event.schema.json'
import aggSchema from './schemas/agg.schema.json'
import operatorStore from './mock/operator.store.json'
import validatorStore from './mock/validator.store.json'

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

export type EventTableSchema = {
  // The chain which the event belongs to (e.g. iotex, ethereum)
  chain:'etheruem' | 'iotex';
  // The network which the event was received on (e.g. mainnet, testnet)
  network: 'mainnet' | 'testnet' | 'goerli';
  // The provider used to source the event (e.g. infura, consensus)
  provider: 'alchemy' | 'consensus';
  // The type of event (e.g. block, transaction)
  type: 'block' | 'transaction';
  // The height of the block the event belongs to
  height: number;
  // The block hash
  block: string;
  // The transaction hash
  transaction: string;
  // The timestamp of the event recieved by the blockchain (format: Modified ISO 8601 e.g. 2015-03-04 22:44:30.652)"
  receivedAt: string;
  // The sender's address
  sender: string;
  // The recipient's address
  recipient: string;
  // The sender's balance at the time of the event
  senderBalance: string;
  // The recipient's balance at the time of the event
  recipientBalance: string;
  // The amount transferred in the event
  amount: string;
  // The exchange price of the coin at the time of the event
  price: number;
}

export { eventSchema, aggSchema, operatorStore, validatorStore}