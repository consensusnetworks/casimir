import accountSchema from "./schemas/account.schema.json"
import accountStore from "./mock/account.store.json"
import actionSchema from "./schemas/action.schema.json"
import eventSchema from "./schemas/event.schema.json"
import nonceSchema from "./schemas/nonce.schema.json"
import operatorSchema from "./schemas/operator.schema.json"
import operatorStore from "./mock/operator.store.json"
import reshareStore from "./mock/reshare.store.json"
import userAccountSchema from "./schemas/user_account.schema.json"
import userSchema from "./schemas/user.schema.json"
import userStore from "./mock/user.store.json"
import validatorStore from "./mock/validator.store.json"
import { Postgres } from "../../../services/users/src/providers/postgres"
import { JsonType, GlueType, PostgresType, Schema } from "./providers/schema"
import { JsonSchema } from "./interfaces/JsonSchema"

export {
  accountSchema,
  accountStore,
  actionSchema,
  eventSchema,
  nonceSchema,
  operatorSchema,
  operatorStore,
  reshareStore,
  userAccountSchema,
  userSchema,
  userStore,
  validatorStore,
  Postgres,
  Schema
}

export type { JsonSchema, JsonType, GlueType, PostgresType }