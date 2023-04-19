import accountSchema from './schemas/account.schema.json'
import nonceSchema from './schemas/nonce.schema.json'
import userSchema from './schemas/user.schema.json'
import eventSchema from './schemas/event.schema.json'
import aggSchema from './schemas/agg.schema.json'
import usersAccountsSchema from './schemas/users_accounts.schema.json'
import operatorStore from './mock/operator.store.json'
import validatorStore from './mock/validator.store.json'
import accountStore from './mock/account.store.json'
import userStore from './mock/user.store.json'
import { Postgres } from './providers/postgres'
import { JsonType, GlueType, PostgresType, Schema } from './providers/schema'
import { JsonSchema } from './interfaces/JsonSchema'

export {
  accountSchema,
  nonceSchema,
  userSchema,
  usersAccountsSchema,
  eventSchema,
  aggSchema,
  accountStore,
  userStore,
  operatorStore,
  validatorStore,
  Postgres,
  Schema
}

export type { JsonSchema, JsonType, GlueType, PostgresType }