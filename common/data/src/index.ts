import accountSchema from './schemas/account.schema.json'
import nonceSchema from './schemas/nonce.schema.json'
import userSchema from './schemas/user.schema.json'
import eventSchema from './schemas/event.schema.json'
import walletSchema from './schemas/wallet.schema.json'
import stakingActionSchema from './schemas/staking_action.schema.json'
import userAccountSchema from './schemas/user_account.schema.json'
import operatorStore from './mock/operator.store.json'
import validatorStore from './mock/validator.store.json'
import accountStore from './mock/account.store.json'
import userStore from './mock/user.store.json'
import { Postgres } from '../../../services/users/src/providers/postgres'
import { JsonType, GlueType, PostgresType, Schema } from './providers/schema'
import { JsonSchema } from './interfaces/JsonSchema'

export {
  accountSchema,
  nonceSchema,
  userSchema,
  userAccountSchema,
  eventSchema,
  walletSchema,
  stakingActionSchema,
  accountStore,
  userStore,
  operatorStore,
  validatorStore,
  Postgres,
  Schema
}

export type { JsonSchema, JsonType, GlueType, PostgresType }