import accountSchema from './schemas/account.schema.json'
import nonceSchema from './schemas/nonce.schema.json'
import userSchema from './schemas/user.schema.json'
import eventSchema from './schemas/event.schema.json'
import aggSchema from './schemas/agg.schema.json'
import operatorStore from './mock/operator.store.json'
import validatorStore from './mock/validator.store.json'
import { JsonSchema } from './interfaces/JsonSchema'
import { JsonType, GlueType, PgType, Schema } from './providers/schema'

export {
  accountSchema,
  nonceSchema,
  userSchema,
  eventSchema,
  aggSchema,
  operatorStore,
  validatorStore,
  Schema
}

export type { JsonSchema, JsonType, GlueType, PgType }