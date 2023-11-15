import accountSchema from "./schemas/account.schema.json"
import actionSchema from "./schemas/action.schema.json"
import eventSchema from "./schemas/event.schema.json"
import nonceSchema from "./schemas/nonce.schema.json"
import operatorSchema from "./schemas/operator.schema.json"
import userAccountSchema from "./schemas/user_account.schema.json"
import userSchema from "./schemas/user.schema.json"
import { Postgres } from "../../../services/users/src/providers/postgres"
import { JsonType, GlueType, PostgresType, Schema } from "./providers/schema"
import { JsonSchema } from "./interfaces/JsonSchema"

export {
	accountSchema,
	actionSchema,
	eventSchema,
	nonceSchema,
	operatorSchema,
	userAccountSchema,
	userSchema,
	Postgres,
	Schema
}

export type { JsonSchema, JsonType, GlueType, PostgresType }